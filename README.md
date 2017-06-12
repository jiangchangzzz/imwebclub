imwebclub
=

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

webpack构建：
```bash
npm run build
```

webpack watch：
```bash
npm run watch
```

前端代码路径：
```bash
./trunk/
```
，构建后生成 ./viwes, ./public 文件夹，分别存放编译好的页面模版以及静态资源       

./libs目录下的是旧文章编辑页依赖的资源，不改文章编辑页的话基本不用动

后台代码：
```bash
./server/
```

