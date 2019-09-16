Object.assign(ditto, {
  // index page
  index: "README.md",

  // sidebar file
  sidebar_file: "command/category.md",

  // where the docs are actually stored on github - so you can edit
  base_url: "https://github.com/wuliupo/linux/edit/master",
  git_url: "https://github.com/wuliupo/linux",

  fixPath: function(paths) {
    return paths.replace('./', '#command/');
  }
});
