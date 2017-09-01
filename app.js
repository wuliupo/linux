const Crawler = require('crawler');
const toMarkdown = require('to-markdown');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');

const categories = [];
let contents = '# [Linux Command](#)\n## Content List\n';
const commands = [];
const images = [];

const crawlCategory = () => {
    return new Promise((resolve, reject)=> {
        console.log('start crawl category.');

        const c = new Crawler({
            callback: function(error, res, done) {
                if (error) {
                    reject();
                } else {
                    const $ = res.$;
                    $('.c_box').each(function() {
                        const title = $(this).find('.hd h3').text();
                        const category = [];
                        $(this).find('.bd li').each(function() {
                            const $link = $(this).find('a');
                            category.push({
                                title: $link.text(),
                                link: $link.attr('href')
                            })
                        });

                        categories.push({
                            title,
                            category
                        })
                    });
                }

                done();

                resolve();
            }
        });

        c.queue('http://man.linuxde.net/');
    });
};

const crawlSubCategory = () => {
    return new Promise((resolve, reject) => {
        console.log('start crawl sub category.');

        const c = new Crawler({
            callback: function(error, res, done) {
                if (error) {
                    console.log('crawl sub category => error');
                    reject();
                } else {
                    console.log(`crawl sub category => ${decodeURI(res.request.uri.href)}`);

                    const $ = res.$;
                    const link = decodeURI(res.request.uri.href);
                    const category = [];
                    $('.item').each(function() {
                        const $this = $(this);
                        const cmd = {
                            title: $this.find('a').text(),
                            link: $this.find('a').attr('href'),
                            desc: $this.find('.des').text()
                        };
                        category.push(cmd);
                        commands.push(cmd);
                    });

                    for (let lc of categories) {
                        const cat = lc.category.find(c => c.link === link);
                        if (cat) {
                            cat.category = category;
                            break;
                        }
                    }
                }

                done();
            }
        });

        const links = categories.reduce((accumulator, currentValue) => {
            return accumulator.concat(currentValue.category);
        }, []).map(v => encodeURI(v.link));

        c.queue(links);

        c.on('drain', function() {
            let filename  = path.join(__dirname, 'command', 'category.json');
            let str = `${JSON.stringify(categories, null, 4)}`;
            fs.writeFileSync(filename, str);
            console.log(`create category.json -> OK!`);

            filename  = path.join(__dirname, 'command', 'command.json');
            fs.writeFileSync(filename, `${JSON.stringify(commands, null, 4)}`);
            console.log(`create command.json -> OK!`);

            // Markdown content
            categories.forEach(category => {
                contents += `1. ${category.title}\n`;
                category.category.forEach(category2 => {
                    contents += `  1. ${category2.title}\n`;
                    category2.category.forEach(category3 => {
                        contents += `    1. [${category3.title}: ${category3.desc}](#command/${category3.title})\n`;
                    });
                });
            });

            filename  = path.join(__dirname, 'command', 'category.md');
            fs.writeFileSync(filename, contents);
            console.log(`create category.md -> OK!`);

            resolve();
        })
    })
};

const crawlCommand = () => {
    return new Promise((resolve, reject) => {
        console.log('start crawl command.');

        const c = new Crawler({
            callback: function(error, res, done) {
                if (error) {
                    console.log('crawl command => error');

                    reject();
                } else {
                    console.log(`crawl command => ${decodeURI(res.request.uri.href)}`);

                    const $ = res.$;
                    const title = res.request.path.substr(1);
                    $('.post_bd.post .content-index').remove()
                    const content = $('.post_bd.post').html();

                    $('.post_bd.post img').each(function() {
                        images.push($(this).attr('src'));
                    });

                    let mdStr = toMarkdown(content);
                    mdStr = mdStr.replace(/<pre>/gi,'```\n')
                                 .replace(/<\/pre>/gi,'\n```')
                                 .replace(/<span.*?>/gi,'')
                                 .replace(/<\/span>/gi,'')
                                 .replace(/http:\/\/man.linuxde.net\//gi, '#/')
                                 .replace(/#\/wp-content.*\/(.*\.*)/gi, './images/$1')

                    const filename  = path.join(__dirname, 'command', `${title}.md`);
                    fs.writeFileSync(filename, mdStr);
                    console.log(`create ${title} -> OK!`);
                }

                done();
            }
        })

        const links = (commands || []).map(v => v.link);
        c.queue(links);
        c.on('drain', function() {
            console.log('end crawl command.');

            resolve();
        })
    });
}

const crawlImages = () => {
    return new Promise(resolve => {
        console.log('start crawl images.');

        const c = new Crawler({
            gzip: false,
            encoding: null,
            jQuery: false,
            callback: function (error, res, done) {
                if (error) {
                    console.log('crawl images => error');

                    reject();
                } else {
                    const index = res.request.uri.href.lastIndexOf('/');
                    const name = res.request.uri.href.substr(index + 1);
                    const filename  = path.join(__dirname, 'command', 'images', name);
                    fs.writeFile(filename, res.body, function (err) {
                        if (err) {
                            console.log(`create ${name} -> error`);
                        } else {
                            console.log(`create ${name} -> OK!`);
                        }
                    });
                }

                done();
            }
        });

        c.queue(images);
        c.on('drain', function() {
            console.log('end crawl images.');

            resolve();
        })
    });
}

crawlCategory()
    .then(() => crawlSubCategory())
    .then(() => crawlCommand())
    .then(() => crawlImages())
    .catch(e => {
        console.log(e);
    });
