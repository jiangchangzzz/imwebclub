/*!
 * nodeclub - app.js
 */

/**
 * Module dependencies.
 */

var config = require('./server/config');

// if (!config.debug && config.oneapm_key) {
//   require('oneapm');
// }

require('colors');
var path = require('path');
var Loader = require('loader');
var LoaderConnect = require('loader-connect')
var express = require('express');
var session = require('express-session');
var passport = require('passport');
require('./server/middlewares/mongoose_log'); // 打印 mongodb 查询日志
require('./server/models');
var GitHubStrategy = require('passport-github').Strategy;
var githubStrategyMiddleware = require('./server/middlewares/github_strategy');
var webRouter = require('./server/web_router');
var apiRouterV1 = require('./server/api_router_v1');
var auth = require('./server/middlewares/auth');
var errorPageMiddleware = require('./server/middlewares/error_page');
var proxyMiddleware = require('./server/middlewares/proxy');
var RedisStore = require('connect-redis')(session);
var _ = require('lodash');
var csurf = require('csurf');
var compress = require('compression');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var errorhandler = require('errorhandler');
var cors = require('cors');
var requestLog = require('./server/middlewares/request_log');
var renderMiddleware = require('./server/middlewares/render');
var logger = require('./server/common/logger');
var helmet = require('helmet');
var bytes = require('bytes');

var mongoose=require('mongoose');
var bluebird=require('bluebird');
var flash=require('connect-flash');

var messageCount=require('./server/middlewares/message_count');

// 静态文件目录
var staticDir = path.join(__dirname, 'public');
// lib文件目录 非模块化插件
var libsDir = path.join(__dirname, 'libs');

// assets
var assets = {};

if (config.mini_assets) {
  try {
    assets = require('./server/assets.json');
  } catch (e) {
    logger.error('You must execute `make build` before start app when mini_assets is true.');
    throw e;
  }
}

var urlinfo = require('url').parse(config.host);
config.hostname = urlinfo.hostname || config.host;

var app = express();

// configuration in all env
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs-mate'));
app.locals._layoutFile = 'layout.html';
app.enable('trust proxy');

// Request logger。请求时间
app.use(requestLog);

if (config.debug) {
  // 渲染时间
  app.use(renderMiddleware.render);
}

// 静态资源
if (config.debug) {
  app.use(LoaderConnect.less(__dirname)); // 测试环境用，编译 .less on the fly
}
app.use('/public', express.static(staticDir, {
   maxAge: 864000  // one day
}));
app.use('/libs', express.static(libsDir, {
   maxAge: 864000  // one day
}));
app.use('/agent', proxyMiddleware.proxy);

// 通用的中间件
app.use(require('response-time')());
app.use(helmet.frameguard('sameorigin'));
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(require('method-override')());
app.use(require('cookie-parser')(config.session_secret));
app.use(compress());
app.use(session({
  secret: config.session_secret,
  store: new RedisStore({
    port: config.redis_port,
    host: config.redis_host,
    db: config.redis_db,
    pass: config.redis_password,
  }),
  resave: false,
  saveUninitialized: false,
}));

// oauth 中间件
app.use(passport.initialize());

// github oauth
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});
passport.use(new GitHubStrategy(config.GITHUB_OAUTH, githubStrategyMiddleware));

// custom middleware
app.use(auth.authUser);
app.use(auth.blockUser());

//消息数量中间件
app.use(messageCount);

if (!config.debug) {
  app.use(function (req, res, next) {
    if (req.path === '/api' || req.path.indexOf('/api') === -1) {
      csurf()(req, res, next);
      return;
    }
    next();
  });
  app.set('view cache', true);
}

// for debug
// app.get('/err', function (req, res, next) {
//   next(new Error('haha'))
// });

// set static, dynamic helpers
_.extend(app.locals, {
  config: config,
  Loader: Loader,
  assets: assets
});

app.use(errorPageMiddleware.errorPage);
_.extend(app.locals, require('./server/common/render_helper'));
app.use(function (req, res, next) {
  res.locals.csrf = req.csrfToken ? req.csrfToken() : '';
  next();
});

app.use(busboy({
  limits: {
    fileSize: bytes(config.file_limit)
  }
}));

//mongoose使用bluebird提供的扩展Promise
mongoose.Promise=bluebird;

//使用flash中间件显示成功和错误信息
app.use(flash());
app.use(function(req,res,next){
  res.locals.success=req.flash('success').toString();
  res.locals.error=req.flash('error').toString();
  next();
});

// routes
app.use('/api/v1', cors(), apiRouterV1);
app.use('/', webRouter);

// error handler
if (config.debug) {
  app.use(errorhandler());
} else {
  //没有找到则跳转到404页面
  app.use(function(req,res){
    if(!res.headersSent){
      return res.status(404).render('error/index',{ _layoutFile: false, code: 404 });
    }
  });

  //服务器错误跳转到5xx页面
  app.use(function (err, req, res, next) {
    logger.error(err);
    return res.status(500).render('error/index',{ _layoutFile: false, code: 500 });
  });
}

if (!module.parent) {
  app.listen(config.port, function () {
    logger.info('Imwebclub listening on port', config.port);
    logger.info('God bless love....');
    logger.info('You can debug your app with http://localhost:' + config.port);
    logger.info('');
  });
}

module.exports = app;
