# imwebclub

## 介绍

imwebclub 是使用 **Node.js** 和 **MongoDB** 开发的社区系统，界面优雅，功能丰富，小巧迅速，基于nodeclub开源项目。

## 安装部署

线上跑的是 [Node.js](https://nodejs.org) v4.4.0，[MongoDB](https://www.mongodb.org) 是 v3.0.5，[Redis](http://redis.io) 是 v3.0.3。

```
1. 安装 `Node.js/io.js[必须]` `MongoDB[必须]` `Redis[必须]`
2. 启动 MongoDB 和 Redis
3. `$ npm install` 安装 Nodeclub 的依赖包
4. `$ npm run build` webpack构建
5. `$ node app.js`
6. visit `http://localhost:3001`
7. done!
```

webpack构建用于生产环境的代码
```bash
npm run build
```

webpack构建带有watch功能的前端打包，需要手动刷新浏览器
```bash
npm run watch
```

前端代码路径：
```bash
./trunk/
```
，构建后生成 ./viwes, ./public 文件夹，分别存放编译好的页面模版以及静态资源

./libs目录下的是旧文章编辑页依赖的资源，不改文章编辑页的话基本不用动

后台代码路径：
```bash
./server/
```

启动pm2服务器
```bash
npm run start
```

重启pm2服务器
```bash
npm run restart
```
部署时只需要在服务器目录中git pull，然后拷贝本地构建好的views和public文件夹到服务器，然后重启pm2服务器即可

## 新增功能

- 专栏模块

用于将文章归类于不同的专栏，用户可以关注专栏，专栏更新时用户获取邮件提醒

代码位于：server/controllers/column.js


- 名人堂模块

用于展示前端社区中比较活跃的大牛和IMWeb团队成员，可关注IMWeb团队成员

代码位于：server/controllers/celebrity.js


- 消息模块

用于向用户推送关注的用户，专栏，文章，系统的消息提醒

代码位于：server/controllers/message.js


- 管理后台

社区管理员可对专栏，名人堂，消息数据进行管理

代码位于：server/controllers/admin.js


- conf相关分享微信后台

用作代理服务器，辅助conf官网向微信服务器请求access_token

代码位于：server/controllers/conf.js


- 社区公众号微信后台

用于社区公众号底栏修改和文章推送等日常管理

代码位于：server/controllers/wechatCenter.js

