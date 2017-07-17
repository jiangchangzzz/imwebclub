/**
 * config
 */

var path = require('path');

var domain = 'test.imweb.io';

var config = {
  // debug 为 true 时，用于本地调试
  debug: false,
  name: '腾讯Web前端 IMWeb 团队社区 | blog | 团队博客', // 社区名字
  description: 'Web前端 腾讯IMWeb 团队社区', // 社区的描述
  keywords: '前端交流,前端社区,前端,iconfont,javascript,html,css,webfront,nodejs,vue,react,react-native,node, express, connect, socket.io, lego.imweb.io',

  // 添加到 html head 中的信息
  site_headers: [
    '<meta name="author" content="imwebteam@tencent" />',
    '<meta property="wb:webmaster" content="f823bb51f1b4e265" />'
  ],
  site_logo: '/public/images/icon.png', // default is `name`
  site_icon: '/public/images/icon.png', // 默认没有 favicon, 这里填写网址
  // 右上角的导航区
  site_navs: [
    // 格式 [ path, title, [target=''] ]
    ['/about', '关于']
  ],
  // cdn host，如 http://cnodejs.qiniudn.com
  site_static_host: '', // 静态文件存储域名
  // 社区的域名
  host: domain,
  // 默认的Google tracker ID，自有站点请修改，申请地址：http://www.google.com/analytics/
  google_tracker_id: 'UA-7317009-5',

  // mongodb 配置
  db: 'mongodb://127.0.0.1/node_club_dev',

  // redis 配置，默认是本地
  redis_host: '127.0.0.1',
  redis_port: 6379,
  redis_db: 0,
  redis_password: '',

  session_secret: 'node_club_secret', // 务必修改
  auth_cookie_name: 'node_club',

  // 程序运行的端口
  port: 3001,

  // 话题列表显示的话题数量
  list_topic_count: 12,

  // 首页热文显示话题数量
  list_hot_topic_count: 5,

  // 文章预览的最大长度
  topic_summary_len: 500,

  // 限制发帖时间间隔，单位：毫秒
  post_interval: 2000,

  // 活动列表显示的活动数量
  list_activity_count: 15,

  // 活动列表显示的活动数量
  list_question_count: 15,

  // 已读消息列表显示消息数量
  list_message_count: 15,

  //专栏列表显示专栏数量
  list_column_count: 15,

  //系统消息数量
  list_system_message_count: 15,

  //名人堂数据数量
  list_celebrity_count: 15,

  // RSS配置
  rss: {
    title: 'IMWeb：web牛人社区',
    link: 'http://' + domain,
    language: 'zh-cn',
    description: 'IMWeb：web牛人社区',
    //最多获取的RSS Item数量
    max_rss_items: 50
  },

  // 邮箱配置
  mail_opts: {
    host: 'smtp.126.com',
    port: 25,
    auth: {
      user: 'club@126.com',
      pass: 'club'
    },
    ignoreTLS: true,
  },

  // admin 可删除话题，编辑标签。把 user_login_name 换成你的登录名
  admins: {
    "webryan": true,
    "ouven": true,
    "ouvenzhang": true,
    "henryguo": true,
    "coverguo": true,
    "邝伟科": true,
    // "aaa": true,  // 测试账号 发布删掉
    "张颖": true,
    "devinran": true,
    "jaychen": true,
    "terrance": true,
    "blue": true,
    "test": true,
  },

  // github 登陆的配置
  GITHUB_OAUTH: {
    clientID: 'a32d122e769fae39b898',
    clientSecret: '9cd819a15a6e886077b5a937aa0e1b8aac55f859',
    callbackURL: 'http://' + domain + '/auth/github/callback'
  },

  //weibo app key
  WEIBO_OAUTH: {
    clientID: '3489481381',
    clientSecret: '52410f54674964564a475afc64511e5d',
    callbackURL: 'http://' + domain + '/auth/weibo/callback'
  },

  // 是否允许直接注册（否则只能走 github 的方式）
  allow_sign_up: true,

  // oneapm 是个用来监控网站性能的服务
  // oneapm_key: '',

  // 下面两个配置都是文件上传的配置

  // 7牛的access信息，用于文件上传
  // qn_access: {
  //   accessKey: 'your access key',
  //   secretKey: 'your secret key',
  //   bucket: 'your bucket name',
  //   origin: 'http://your qiniu domain',
  //   // 如果vps在国外，请使用 http://up.qiniug.com/ ，这是七牛的国际节点
  //   // 如果在国内，此项请留空
  //   uploadURL: 'http://xxxxxxxx',
  // },

  //7牛的access信息，用于文件上传
  qn_access: {
    accessKey: '1VQoqeNeV4kDaOHO7ajqYZNm-2lgQ093BUBQKC1U',
    secretKey: 'Q1xh9qaj25Y6jzLt8-4vp5lzbkC9-uAtIOPw02Xj',
    bucket: 'imweb',
    domain: 'http://7tszky.com1.z0.glb.clouddn.com'
  },

  // 文件上传配置
  // 注：如果填写 qn_access，则会上传到 7牛，以下配置无效
  upload: {
    path: path.join(__dirname, 'public/upload/'),
    url: '/public/upload/'
  },

  file_limit: '1MB',

  // 版块
  tabs: [
    ['html', 'HTML'],
    ['rebuild', 'CSS'],
    ['js', 'javascript技术'],
    ['network', 'HTTP网络'],
    ['secure', 'Web安全'],
    ['browser', '浏览器'],
    ['debug', '调试'],
    ['build', '构建工具'],
    ['performance', '性能'],
    ['lib', '前端库'],
    ['dev', '开发模式'],
    ['node', 'nodeJS全栈'],
    ['mobile', '移动开发'],
    ['tools', '工具建设'],
    ['op', '运维']
  ],

  // 活动类型
  activityTabs: [
    ['imweb', 'imweb'],
    ['industry', '行业']
  ],

  // 正则配置
  regExps: {
    email: /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/,
    loginname: /^[\w]{5,20}$/,
    pass: /^[\w~`!@#$%\^&*()\-+=;:'",.<>\/?\\|\[\]{}]{6,20}$/,
    name: /^[\u4e00-\u9fa5]{2,5}$/,
    company: /^[\s\S]{1,50}$/,
    team: /^[\s\S]{0,50}$/,
    topicTitle: /^[\s\S]{1,100}$/,
    topicContent: /^[\s\S]{1,}$/
  },
  // 极光推送
  // jpush: {
  //   appKey: 'YourAccessKeyyyyyyyyyyyy',
  //   masterSecret: 'YourSecretKeyyyyyyyyyyyyy',
  //   isDebug: false,
  // },

  create_post_per_day: 1000, // 每个用户一天可以发的主题数
  create_reply_per_day: 1000, // 每个用户一天可以发的评论数
  create_user_per_ip: 1000,
  visit_per_day: 1000, // 每个 ip 每天能访问的次数
};

if (process.env.NODE_ENV === 'test') {
  console.log('test mode!');
  config.db = 'mongodb://127.0.0.1/node_club_dev';
  // github 登陆的配置
  config.GITHUB_OAUTH = {
    clientID: 'a32d122e769fae39b898',
    clientSecret: '9cd819a15a6e886077b5a937aa0e1b8aac55f859',
    callbackURL: 'http://imweb.io/auth/github/callback'
  };

  //weibo app key
  config.WEIBO_OAUTH = {
    clientID: '3489481381',
    clientSecret: '52410f54674964564a475afc64511e5d',
    callbackURL: "http://imweb.io/auth/weibo/callback"
  };
  config.host = 'imweb.io';
  config.port = 80;
}

module.exports = config;
