**groupdel命令**用于删除指定的工作组，本命令要修改的系统文件包括/ect/group和/ect/gshadow。若该群组中仍包括某些用户，则必须先删除这些用户后，方能删除群组。

### 语法  

```
groupdel(参数)
```

### 参数  

组：要删除的工作组名。

### 实例  

```
[groupadd](https://philipding.github.io/linux-command/groupadd "groupadd命令") damon  //创建damon工作组
groupdel damon  //删除这个工作组
```