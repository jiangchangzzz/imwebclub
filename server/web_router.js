'use strict';
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
var column = require('./controllers/column');
var celebrity=require('./controllers/celebrity');
var staticController = require('./controllers/static');
var auth = require('./middlewares/auth');
var limit = require('./middlewares/limit');
var github = require('./controllers/github');
var search = require('./controllers/search');
var passport = require('passport');
var weibo = require('./controllers/weibo');
var admin = require('./controllers/admin');
var WeiboStrategy = require('passport-weibo').Strategy;
var config = require('./config');
// 新markdown编辑器  发布
var marktang = require('./controllers/marktang');

var conf=require('./controllers/conf');
var wechatBind=require('./controllers/wechatBind');
var wecharCenter=require('./controllers/wechatCenter');

var router = express.Router();

// home page
//router.get('/', site.index);
router.get('/',topic.list);

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
router.get('/user/:name/index', auth.userRequired, user.index); // 用户个人主页
router.get('/user/:name/setting', auth.userRequired, user.showSetting); // 用户个人设置页
router.get('/user/:name/following', auth.userRequired, user.showFollowing); // 用户个人关注
router.get('/user/:name/follower', auth.userRequired, user.showFollower); // 用户粉丝
router.get('/user/:name/questions', auth.userRequired, user.listQuestions); // 用户的we
router.get('/user/:name/collections', auth.userRequired, user.listCollectedTopics);  // 用户收藏的所有话题页
router.get('/user/:name/topics', auth.userRequired, user.listTopics);  // 用户发布的所有话题页
router.get('/user/:name/replies', auth.userRequired, user.listReplies);  // 用户参与的所有回复页
router.get('/user/:name/password', auth.userRequired, user.showPassword);  // 用户密码更改
router.post('/user/:name/setting', auth.userRequired, user.setting); // 提交个人信息设置

router.get('/stars', user.listStars); // 显示所有达人列表页
router.get('/users/top100', user.top100);  // 显示积分前一百用户页
router.post('/user/set_star', auth.adminRequired, user.toggleStar); // 把某用户设为达人
router.post('/user/cancel_star', auth.adminRequired, user.toggleStar);  // 取消某用户的达人身份
router.post('/user/:name/block', auth.adminRequired, user.block);  // 禁言某用户
router.post('/user/:name/delete_all', auth.adminRequired, user.deleteAll);  // 删除某用户所有发言
router.post('/user/follow', auth.userRequired, user.addFollowUser); //添加关注
router.delete('/user/follow', auth.userRequired, user.deleteFollowUser); //取消关注
router.get('/user/followings', auth.userRequired, user.followings); // api:分页获取关注的对象

// message controler
router.get('/message/me', auth.userRequired, message.index); // 用户个人的所有消息页
router.get('/message/system', auth.userRequired, message.system); //系统通知的消息页

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
router.post('/topic/:tid/top/:is_top?', auth.adminRequired, topic.top);  // 将某话题置顶
router.post('/topic/:tid/good/:is_good?', auth.adminRequired, topic.good); // 将某话题加精

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
// router.get('/admin/topic/:key', auth.adminRequired, admin.topic);
router.get('/admin/user/all', auth.adminRequired, admin.user);  //  用户管理
router.get('/admin/reply/all', auth.adminRequired, admin.reply);  //  评论管理
router.get('/admin/column/all', auth.adminRequired, admin.column);   //专栏管理
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

router.get('/admin/message', auth.adminRequired, admin.message);
router.post('/admin/message',auth.adminRequired,admin.createMessage);
router.get('/admin/message/:message/remove',auth.adminRequired, admin.removeMessage);

//名人堂管理
router.get('/admin/celebrity',auth.adminRequired,admin.celebrity);
router.post('/admin/celebrity',auth.adminRequired,admin.createCelebrity);
router.get('/admin/celebrity/:celebrity/remove',auth.adminRequired,admin.removeCelebrity);

// 专栏
router.get('/column/create', auth.userRequired, column.create); //新增某专栏
router.post('/column/create', auth.userRequired, column.put);
router.get('/column/list',column.list);
router.get('/column/:cid/edit', auth.userRequired, column.showEdit);  // 编辑某专栏
router.post('/column/:cid/edit', auth.userRequired, column.update);
router.post('/column/:cid/delete', auth.userRequired, column.delete);  // 删除某专栏
router.get('/column/:cid', column.index);  // 显示专栏详情
router.post('/column/add_topic', auth.userRequired, column.addTopic);
router.post('/column/remove_topic', auth.userRequired, column.removeTopic);

//名人堂
router.get('/celebrity/list', celebrity.list);   //列表页面
router.get('/celebrity/imweb',celebrity.imweb);  //imweb名人页面

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

// github oauth
router.get('/auth/github', passport.authenticate('github'));
router.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/signin' }),
  github.callback);
router.get('/auth/github/new', github.new);
router.post('/auth/github/create', limit.peripperday('create_user_per_ip', config.create_user_per_ip, {showJson: false}), github.create);

// weibo oauth
passport.use(new WeiboStrategy({
    clientID: config.WEIBO_OAUTH.clientID,
    clientSecret: config.WEIBO_OAUTH.clientSecret,
    callbackURL: config.WEIBO_OAUTH.callbackURL
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
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

router.get('/topics/latestTopics/sort/:sort', site.latestTopics);

router.get('/wx/signature',conf.signature);

//wechatBind
router.get('/wechatBind', wechatBind.bind);



module.exports = router;
