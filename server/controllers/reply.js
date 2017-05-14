var validator = require('validator');
var _ = require('lodash');
var EventProxy = require('eventproxy');

var at = require('../common/at');
var message = require('../common/message');
var dataAdapter = require('../common/dataAdapter');
var mail = require('../common/mail');
var tools = require('../common/tools');
var renderHelper = require('../common/render_helper');

var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Question = require('../proxy').Question;
var QuestionAnswer = require('../proxy').QuestionAnswer;
var Reply = require('../proxy').Reply;
var config = require('../config');

var ObjectDict = {
    'topic': Topic.getTopicById,
    'question': Question.getQuestionById
};

exports.query = function (req, res, next){
  var parent_id = req.params.parent_id;
  var sortby = req.query.sortby;

  var sorts = {
    score:-1,
    create_at: 1
  };
  if(sortby === 'time'){
    sorts = {
      create_at: -1
    };
  }
  Reply.getRepliesByParentId(parent_id, sorts, function(err, replies){
    if(err){
      return res.send({
          ret: 1,
          msg: err
      });
    }
    var mainReplies = dataAdapter.appendSubRepliesToReplies(replies);
    res.send({
        ret: 0,
        data: dataAdapter.outReplies(mainReplies)
    });
  });
}

/**
 * 添加回复
 */
exports.add = function (req, res, next) {
    var raw = (req.body.r_content || req.body.content || '').trim();
    var kind = req.params.kind.toLowerCase();
    var parent_id = req.params.parent_id;
    var reply_id = req.body.reply_id || null;//是否为子回复

    var ep = EventProxy.create();
    ep.fail(next);
    ep.on('fail', function(ret, msg) {
        ep.unbind();
        res.send({
            ret: ret,
            msg: msg || ''
        });
    });

    if (!raw) {
        return ep.emit('fail', 401, '回复内容不能为空！');
    }

    if (!ObjectDict.hasOwnProperty(kind) || !parent_id) {
        return ep.emit('fail',1,'参数不合法。');
    }

    //获取回复主体
    ObjectDict[kind](parent_id, ep.doneLater(function (object) {
        if (!object) {
            return ep.emit('fail', 402);
        } else{
          User.getUserById(object.author_id, ep.done(function(author) {
              object.author = author;
              ep.emit('parent', object);
          }));
        }
    }));

    //如果是子回复
    if (reply_id) {
        Reply.getReplyById(reply_id, ep.doneLater(function(parentReply) {
            if (!parentReply) {
                return ep.emit('fail', 403);
            }
            ep.emit('parent_reply', parentReply);
        }));
    } else {
        ep.emitLater('parent_reply', null);
    }

    // 获取登录用户
    User.getUserById(req.session.user._id, ep.done(function (user) {
        if (!user) {
            return ep.emit('fail');
        }
        ep.emit('user', user);
    }));

    // 参数合法则新建reply
    ep.all('parent', 'user', 'parent_reply', function (parent, user) {
            Reply.newAndSave(kind, raw, parent_id, user._id, reply_id, ep.done('reply_saved'));
        }
    );

    // 更新相关字段，推送消息
    ep.all('parent', 'user', 'parent_reply', 'reply_saved', function(parent, user, pReply, reply) {
        parent.last_reply = reply._id;
        parent.last_reply_at = Date.now();
        parent.reply_count++;
        parent.save(ep.done('parent_updated'));

        user.score += 1;
        user.reply_count++;
        user.save(ep.done('user_updated'));

        //console.log(reply);
        // 发送at消息，并防止重复 at 作者
        var newContent = reply.content.replace('@' + parent.author.loginname + ' ', '');
        at.sendMessageToMentionUsers(newContent, parent._id, user._id, reply._id);

        if (parent.author_id.toString() !== user._id.toString()) {
            if (!pReply) {
                // 一级评论给文章作者
                message.sendReplyMessage(
                    parent.author_id, user._id, parent._id, reply._id
                );
                mail.sendReplyMail(parent, parent.author, reply, user);
            } else {
                // 二级评论给文章作者
                message.sendReplyMessage(
                    parent.author_id, user._id, parent._id, reply._id
                );
                mail.sendSubReplyMail(
                    parent, parent.author, pReply, pReply.author, reply, user
                );
            }
        }
        // 二级评论消息给一级评论者
        // 如果一级评论者是文章作者跳过
        var wechatShowContent = renderHelper.htmlToText(reply.content);
        wechatShowContent = (wechatShowContent.length <= 10) ? wechatShowContent : wechatShowContent.substring(0, 15) + '...';
        if (pReply
            && pReply.author._id.toString() !== user._id.toString()
            && pReply.author._id.toString() !== parent.author_id.toString()
        ) {
            message.sendReplyMessage(
               pReply.author._id, user._id, topic._id, reply._id
            );
            mail.sendSubReplyForParentReplyMail(
               topic, topic.author, pReply, pReply.author, reply, user
            );
        }
    });

    ep.all(
        'parent', 'user', 'reply_saved', 'parent_updated', 'user_updated',
        function(topic, user, reply) {
            reply.author = user;
            res.send({
                ret: 0,
                data: {
                    reply: dataAdapter.outReply(reply),
                    reply_count: topic.reply_count,
                    user: {
                        score: user.score,
                        reply_count: user.reply_count
                    }
                }
            });
        }
    );
};

/**
 * 删除回复信息
 */
exports.delete = function (req, res, next) {
  var reply_id = req.body.reply_id;
  var parent_id = req.body.parent_id;
  var ep = EventProxy.create();
  var kind;
  ep.fail(next);
  ep.on('fail', function(ret, msg) {
    ep.unbind();
    res.send({ret: ret || 400, msg: msg || ''});
  });
  ep.on('done', function(topic) {
    res.send({
      ret: 0,
      reply_count: topic.reply_count
    });
  });

  // 获取被删除回复
  Reply.getReplyById(reply_id, ep.done(function(reply) {
    if (!reply) {
        return ep.emit('fail', 401, 'no reply');
    }
    kind = reply.kind || 'topic';
    ep.emit('reply', reply);
  }));

  // 如有上级回复
  ep.all('reply', function(reply) {
    if (reply.reply_id) {
      Reply.getReplyById(reply.reply_id, ep.done(function(parent_reply) {
        ep.emit('parent_reply', parent_reply || null);
      }));
    } else {
        ep.emitLater('parent_reply', null);
    }
  });
  // 获取回复主题作者
  ep.all('reply', function(reply) {
    ObjectDict[kind](reply.topic_id, ep.done(function(parent, author) {
        parent.author = author;
        ep.emit('parent', parent);
    }));
  });
  ep.all('reply', function(reply) {
    QuestionAnswer.getQuestionAnswer(reply.topic_id, reply._id, ep.done(function(question_answer) {
      if (question_answer) {
          return ep.emit('fail', 401, 'please cancel the answer');
      }
    }));
  });
  ep.all(
    'reply', 'parent_reply', 'parent',
    function(reply, parent_reply, parent) {
        var user = req.session.user;
        var hasPermission = user.is_admin
            // 评论者
            || tools.modelEqual(reply.author, user)
            // 一级评论者
            || (parent_reply && tools.modelEqual(parent_reply.author, user))
            // 文章作者
            || tools.modelEqual(parent_author, user);
        if (!hasPermission) {
            return ep.emit('fail', 404, 'no permission');
        }
        reply.deleted = true;
        reply.top = false;
        reply.save();
        //更新评论人
        reply.author.score -= 1;
        reply.author.reply_count--;
        reply.author.save(ep.done('user_updated'));
        // 删除所有子评论
        Reply.removeByCondition({reply_id: reply_id},function(err,commandResult){
          if(err || !commandResult){
            console.log(arguments);
            return ep.emit('fail', 401, 'failed to delete sub reply');
          }else{
            // 更新评论主体
            parent.last_reply = reply._id;
            parent.last_reply_at = Date.now();
            parent.reply_count -= (commandResult.result.n + 1);
            parent.save(ep.done('parent_updated'));
          }
        });

  });
  ep.all(['parent', 'user_updated', 'parent_updated'],function(parent){
    ep.emit('done', parent);
  });
};

/*
 打开回复编辑器
 */
exports.showEdit = function (req, res, next) {
  var reply_id = req.params.reply_id;

  Reply.getReplyById(reply_id, function (err, reply) {
    if (!reply) {
      res.status(422);
      res.render('notify/notify', {error: '此回复不存在或已被删除。'});
      return;
    }
    if (req.session.user._id.equals(reply.author_id) || req.session.user.is_admin) {
      res.render('reply/edit', {
        reply_id: reply._id,
        content: reply.raw || ''
      });
    } else {
      res.status(403);
      res.render('notify/notify', {error: '对不起，你不能编辑此回复。'});
    }
  });
};

/*
 提交编辑回复
 */
exports.update = function (req, res, next) {
  var reply_id = req.params.reply_id;
  var raw = (req.body.t_content || req.body.r_content || req.body.content || '').trim();

  Reply.getReplyById(reply_id, function (err, reply) {
    if (err || !reply) {
      res.render('notify/notify', {error: '此回复不存在或已被删除。'});
      return;
    }

    if (String(reply.author_id) === req.session.user._id.toString() || req.session.user.is_admin) {
      if (raw) {
          Reply.update(reply, raw, function(err) {
              if (err) {
                return next(err);
              }
              var kind = reply.kind || 'topic';
              res.redirect('/'+kind+'/' + reply.topic_id + '#' + reply._id);
          });
      } else {
        res.render('notify/notify', {error: '回复的字数太少。'});
      }
    } else {
      res.render('notify/notify', {error: '对不起，你不能编辑此回复。'});
    }
  });
};

/**
 * admin_required
 */
exports.genAllText = function(req, res, next) {
    Reply.replyList(function(err, list) {
        function task(err) {
            if (err) {
                res.send({
                    ret: 1,
                    error: err.toString()
                });
                return;
            }
            if (!list.length) {
                res.send({
                    ret: 0
                });
                return;
            }
            var item = list.pop();
            item.text = tools.genReplyText(item.content);
            item.save(task);
        };
        task(err);
    });
};
