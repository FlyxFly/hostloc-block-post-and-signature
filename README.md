# hostloc-block-post-and-signature
用于屏蔽Hostloc.com 指定用户的发帖、回帖、签名，根据关键词屏蔽发帖、回帖

## 安装
- 安装Tampermonkey
- 导入此脚本

## 使用

### 安装完成后，在用户头像左边会出现设置入口。
![alt 设置入口](https://s6.jpg.cm/2022/07/09/Pnexh5.png)

### 设置面板
![alt 设置面板](https://s6.jpg.cm/2022/07/09/PneZzR.png)

- 只填屏蔽用户名和关键字，不填Pantry API 参数，表示保存到本地。
- 只填Pantry API 参数，不填屏蔽用户名和关键字，表示从云端获取内容。
- 同时填入Pantry API 参数和屏蔽内容，表示保存到本地，同时上传到云端。



### 使用效果
鼠标移动到屏蔽文本可预览内容，点击可还原内容。
![alt 效果预览](https://s6.jpg.cm/2022/07/09/PneMWC.png)

## 更新历史
- 2022-07-22
v0.2.2 修复用户不显示签名时，脚本报错的问题;修复还原内容后，title属性未清理的问题

- 2022-07-11
v0.2.1 点击设置面板以外的区域可以关闭面板

- 2022-07-09
v0.2 增加云端同步功能

- 2021-12-09
v0.1 第一版