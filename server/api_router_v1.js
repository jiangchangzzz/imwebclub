var express           = require('express');
var topicController   = require('./api/v1/topic');
var topicCollectController   = require('./api/v1/topic_collect');
var userController    = require('./api/v1/user');
var toolsController   = require('./api/v1/tools');
var replyController   = require('./api/v1/reply');
var messageController = require('./api/v1/message');
var notebookController=require('./api/v1/notebook');
var middleware        = require('./api/v1/middleware');
var limit             = require('./middlewares/limit');
var config            = require('./config');

var router            = express.Router();



// 主题
router.get('/topics', topicController.index);
router.get('/topic/:id', topicController.show);
router.post('/topics', middleware.auth, limit.peruserperday('create_topic', config.create_post_per_day, {showJson: true}), topicController.create);
router.post('/topics/update', middleware.auth, topicController.update);
// 获取我的文章
router.get('/topic/:id/get', middleware.auth, topicController.get);
router.get('/topic',topicController.getTopicsByNotebook);


// 主题收藏
router.post('/topic_collect/collect', middleware.auth, topicCollectController.collect); // 关注某话题
router.post('/topic_collect/de_collect', middleware.auth, topicCollectController.de_collect); // 取消关注某话题
router.get('/topic_collect/:loginname', topicCollectController.list);

// 用户
router.get('/user/:loginname', userController.show);

// accessToken 测试
router.post('/accesstoken', middleware.auth, toolsController.accesstoken);

// 我的文章
router.post('/topic/listmy', middleware.auth, topicController.listmy);

// 评论
router.post('/topic/:topic_id/replies', middleware.auth, limit.peruserperday('create_reply', config.create_reply_per_day, {showJson: true}), replyController.create);
router.post('/reply/:reply_id/ups', middleware.auth, replyController.ups);

// 通知
router.get('/messages', middleware.auth, messageController.index);
router.get('/message/count', middleware.auth, messageController.count);
router.post('/message/mark_all', middleware.auth, messageController.markAll);

//文集
router.get('/notebook',notebookController.getNotebook);
router.post('/notebook',notebookController.postNotebook);
router.put('/notebook/:id',notebookController.putNotebook);
router.delete('/notebook/:id',notebookController.deleteNotebook);

module.exports = router;
