# hostloc-block-post-and-signature
用于屏蔽Hostloc.com 指定用户的发帖、回帖、签名，根据关键词屏蔽发帖、回帖

## 安装
- 安装Tampermonkey
- 导入此脚本

## 使用

### 安装完成后，在用户头像左边会出现设置入口。
![alt 设置入口](https://img.gejiba.com/images/ed4d2f0d847de003dc17c360b94c93f4.png)

### 设置面板
![alt 设置面板](https://img.gejiba.com/images/6bee06828269b6560fc8726f3276d73f.png)

- 只填屏蔽用户名和关键字，不填Pantry API 参数，表示保存到本地。
- 只填Pantry API 参数，不填屏蔽用户名和关键字，表示从云端获取内容。
- 同时填入Pantry API 参数和屏蔽内容，表示保存到本地，同时上传到云端。



### 使用效果
鼠标移动到屏蔽文本可预览内容，点击可还原内容。
![alt 效果预览](https://img.gejiba.com/images/f882afee72c60f63131edadaf04565d5.png)

## 更新历史
- 2023-11-10
v0.2.4 取消弹窗，改为控制台输出

- 2022-11-25
v0.2.3 关键字现在不区分大小写了，比如`rn`可以屏蔽RN / rn / Rn / rN

- 2022-07-22
v0.2.2 修复用户不显示签名时，脚本报错的问题;修复还原内容后，title属性未清理的问题

- 2022-07-11
v0.2.1 点击设置面板以外的区域可以关闭面板

- 2022-07-09
v0.2 增加云端同步功能

- 2021-12-09
v0.1 第一版