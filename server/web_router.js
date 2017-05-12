/*!
 * nodeclub - route.js
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var express = require('express');
var sign = require('./controllers/sign');
var site = require('./controllers/site');
var user = require('./controllers/user');
var message = require('./controllers/message');
var draft = require('./controllers/draft');
var operate = require('./controllers/operate');
var question = require('./controllers/question');
var topic = require('./controllers/topic');
var reply = require('./controllers/reply');
var activity = require('./controllers/activity');
var rss = require('./controllers/rss');
var staticController = require('./controllers/static');
var auth = require('./middlewares/auth');
var limit = require('./middlewares/limit');
var github = require('./controllers/github');
var search = require('./controllers/search');
var passport = require('passport');
var weibo = require('./controllers/weibo');
var admin = require('./controllers/admin');
var WeiboStrategy = require('passport-weibo').Strategy;
var configMiddleware = require('./middlewares/conf');
var config = require('./config');
// 新markdown编辑器  发布
var marktang = require('./controllers/marktang');

var router = express.Router();

// home page
router.get('/', site.index);
// sitemap
router.get('/sitemap.xml', site.sitemap);
// mobile app download
// router.get('/app/download', site.appDownload);

// sign controller
if (config.allow_sign_up) {
  router.get('/signup', sign.showSignup);  // 跳转到注册页面
  router.post('/signup', sign.signup);  // 提交注册信息
} else {
  // 进行github验证
  router.get('/signup', function (req, res, next) {
    return res.redirect('/auth/github')
  });
}
router.get('/signout', sign.signout);  // 登出
router.get('/signin', sign.showLogin);  // 进入登录页面
router.post('/signin', sign.login);  // 登录校验
router.get('/active_account', sign.activeAccount);  //帐号激活

router.get('/search_pass', sign.showSearchPass);  // 找回密码页面
router.post('/search_pass', sign.updateSearchPass);  // 更新密码
router.get('/reset_pass', sign.resetPass);  // 进入重置密码页面
router.post('/reset_pass', sign.updatePass);  // 更新密码

// user controller
router.get('/user/:name/index', user.index); // 用户个人主页
router.get('/user/:name/setting', auth.userRequired, user.showSetting); // 用户个人设置页
router.get('/user/:name/following', user.showFollowing); // 用户个人关注
router.get('/user/:name/follower', user.showFollower); // 用户粉丝
router.get('/user/:name/question', user.listQuestions); // 用户的we
router.get('/user/:name/collections', user.listCollectedTopics);  // 用户收藏的所有话题页
router.get('/user/:name/topics', user.listTopics);  // 用户发布的所有话题页
router.get('/user/:name/replies', user.listReplies);  // 用户参与的所有回复页
router.get('/user/:name/password', auth.userRequired, user.showPassword);  // 用户密码更改
router.post('/setting', auth.userRequired, user.setting); // 提交个人信息设置

router.get('/stars', user.listStars); // 显示所有达人列表页
router.get('/users/top100', user.top100);  // 显示积分前一百用户页
router.post('/user/set_star', auth.adminRequired, user.toggleStar); // 把某用户设为达人
router.post('/user/cancel_star', auth.adminRequired, user.toggleStar);  // 取消某用户的达人身份
router.post('/user/:name/block', auth.adminRequired, user.block);  // 禁言某用户
router.post('/user/:name/delete_all', auth.adminRequired, user.deleteAll);  // 删除某用户所有发言
router.post('/user/follow', user.addFollowUser); //添加关注
router.delete('/user/follow', user.deleteFollowUser); //取消关注

// message controler
router.get('/my/messages', auth.userRequired, message.index); // 用户个人的所有消息页

// 文章

// 保存新建的文章 markdown
router.post('/topic/save', auth.userRequired, limit.postInterval, topic.put);

// 新建文章界面
router.get('/topic/create', auth.userRequired, topic.create); //新增某话题
router.post('/topic/create', auth.userRequired, limit.peruserperday('create_topic', config.create_post_per_day, {showJson: false}), topic.put);
router.get('/topic/:tid/edit', auth.userRequired, topic.showEdit);  // 编辑某话题
router.post('/topic/:tid/edit', auth.userRequired, topic.update);
router.post('/topic/:tid/delete', auth.userRequired, topic.delete);
router.post('/topic/:tid/collect', auth.userRequired, topic.collect);
router.get('/topic/:tid', topic.index);  // 显示某个话
router.get('/topic/tab/:tab', topic.list);

// 活动
router.get('/activity/create', auth.userRequired, activity.create); //新增某活动
router.post('/activity/create', auth.userRequired, activity.put);
router.get('/activity/:tid/edit', auth.userRequired, activity.showEdit);  // 编辑某活动
router.post('/activity/:tid/edit', auth.userRequired, activity.update);
router.post('/activity/:tid/delete', auth.userRequired, activity.delete);
router.get('/activity/:tid', activity.index);  // 显示某个话题
router.get('/activity/tab/:tab', activity.list);

// 通用操作
router.post('/operate/top', auth.adminRequired, operate.top);  // 将某目标置顶
router.post('/operate/good', auth.adminRequired, operate.good); // 将某目标加精
router.post('/operate/lock', auth.adminRequired, operate.lock); // 锁定目标，不能再回复
router.post('/operate/collect', auth.userRequired, operate.collect); // （取消）收藏某个目标
router.post('/operate/follow', auth.userRequired, operate.follow); // （取消）关注某个目标
router.post('/operate/up', auth.userRequired, operate.up); // 为目标点赞

// 回复
router.get('/reply/:parent_id/query', reply.query);//排序获取评论列表
router.post('/:kind/:parent_id/reply', auth.userRequired, limit.peruserperday('create_reply', config.create_reply_per_day, {showJson: false}), reply.add); // 提交一级回复
router.get('/reply/:reply_id/edit', auth.userRequired, reply.showEdit); // 修改自己的评论页
router.post('/reply/:reply_id/edit', auth.userRequired, reply.update); // 修改某评论
router.post('/reply/:reply_id/delete', auth.userRequired, reply.delete); // 删除某评论
router.post('/upload', auth.userRequired, topic.upload); //上传图片

// 问答
router.get('/question/create', auth.userRequired, question.create); //新增某活动
router.post('/question/create', auth.userRequired, limit.peruserperday('create_question', config.create_post_per_day, {showJson: false}), question.put);
router.get('/question/:qid/edit', auth.userRequired, question.showEdit);  // 编辑某活动
router.post('/question/:qid/edit', auth.userRequired, question.update);
router.post('/question/:qid/answer', auth.userRequired, question.answer);
router.post('/question/:qid/delete', auth.userRequired, question.delete);

router.get('/question/:qid', question.index);  // 显示某个问答
router.get('/question/tab/:tab', question.list);

// 草稿
router.post('/draft/autosave', auth.userRequired, draft.autosave);
router.get('/draft/countmy', auth.userRequired, draft.countmy);
router.get('/draft/listmy', auth.userRequired, draft.listmy);
router.post('/draft/delete/:id', auth.userRequired, draft.delete);
router.get('/draft/get/:id', auth.userRequired, draft.get);


//admin
router.get('/admin/topic/all', auth.adminRequired, admin.topic);  //  话题管理
router.get('/admin/user/all', auth.adminRequired, admin.user);  //  用户管理
router.get('/admin/reply/all', auth.adminRequired, admin.reply);  //  评论管理
router.get('/admin/topic/:tab', auth.adminRequired, admin.topic);  //  话题分类
router.get('/admin/:name/edit', auth.adminRequired, admin.editUser);  //  编辑用户信息
router.post('/admin/user/save', auth.adminRequired, admin.saveUser);  //  保存用户信息
router.get('/admin/reply/:tid', auth.adminRequired, admin.replyForTopic);  //  某个话题下的评论
router.get('/admin/banner/all', auth.adminRequired, admin.banner); // 获取banner
router.get('/admin/banner/add', auth.adminRequired, admin.addBanner); // 增加banner
router.post('/admin/banner/save', auth.adminRequired, admin.saveBanner); // 保存banner
router.post('/admin/banner/delete', auth.adminRequired, admin.removeBanner); // 删除banner
router.get('/admin/edit/:bid', auth.adminRequired, admin.editBanner); // 编辑banner

router.get('/admin/activity/all', auth.adminRequired, admin.activity);
router.get('/admin/activity/add', auth.adminRequired, admin.addActivity);
router.post('/admin/activity/save', auth.adminRequired, admin.saveActivity);
router.get('/activity/edit/:acid', auth.adminRequired, admin.editActivity);
router.post('/admin/activity/delete', auth.adminRequired, admin.removeActivity); // 删除banner

// static
router.get('/about', staticController.about);
router.get('/faq', staticController.faq);
router.get('/getstart', staticController.getstart);
router.get('/robots.txt', staticController.robots);
router.get('/api', staticController.api);


//marktang相关
router.get('/marktang/', auth.userRequired, marktang.index); // 马克糖首页
router.get('/marktang/index', auth.userRequired, marktang.index); // 马克糖首页
router.post('/marktang/html', auth.userRequired, marktang.md2html); // gen html content
router.post('/marktang/save', auth.userRequired, marktang.save); // gen html content
router.get('/marktang/evernote', auth.userRequired, marktang.evernote); // 获取auth uri for evernote
router.get('/marktang/evernote_callback', auth.userRequired, marktang.evernote_callback); // 获取access_token for evernote
router.post('/marktang/evernote_save', auth.userRequired, marktang.evernote_save); // save evernote
router.get('/marktang/evernote_getnote', auth.userRequired, marktang.evernote_getnote); //

//rss
router.get('/rss', rss.index);

// github oauth
router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/signin' }),
  github.callback);
router.get('/auth/github/new', github.new);
router.post('/auth/github/create', limit.peripperday('create_user_per_ip', config.create_user_per_ip, {showJson: false}), github.create);

// weibo oauth
// Use the WeiboStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Weibo
//   profile), and invoke a callback with a user object.
passport.use(new WeiboStrategy({
    clientID: config.WEIBO_OAUTH.clientID,
    clientSecret: config.WEIBO_OAUTH.clientSecret,
    callbackURL: config.WEIBO_OAUTH.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Weibo profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Weibo account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

router.get('/auth/weibo',passport.authenticate('weibo'));

router.get('/auth/weibo/callback',
  passport.authenticate('weibo', { failureRedirect: '/signin' }),
  weibo.callback);
router.get('/auth/weibo/new', weibo.new);
router.post('/auth/weibo/create', limit.peripperday('create_user_per_ip', config.create_user_per_ip, {showJson: false}), weibo.create);


router.post('/search', search.index);
router.get('/search/:key', search.index);
// router.get('/search', search.index);

if (!config.debug) { // 这个兼容破坏了不少测试
	router.get('/:name', function (req, res) {
	  res.redirect('/user/' + req.params.name)
	})
}


module.exports = router;
