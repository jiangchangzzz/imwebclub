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
var Reply = require('../proxy').Reply;
var config = require('../config');

/**
 * 添加回复
 */
exports.add = function (req, res, next) {
    var raw = (req.body.r_content || req.body.content || '').trim();
    var topic_id = req.params.topic_id;
    var reply_id = req.body.reply_id || null;

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

    Topic.getTopic(topic_id, ep.doneLater(function (topic) {
        if (!topic) {
            return ep.emit('fail', 402);
        }
        User.getUserById(topic.author_id, ep.done(function(author) {
            topic.author = author;
            ep.emit('topic', topic);
        }));
    }));

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

    User.getUserById(req.session.user._id, ep.done(function (user) {
        if (!user) {
            return ep.emit('fail');
        }
        ep.emit('user', user);
    }));

    ep.all(
        'topic', 'user', 'parent_reply',
        function (topic, user, pReply) {
            Reply.newAndSave(
                raw, topic_id, user._id, reply_id,
                ep.done('reply_saved')
            );
        }
    );

    ep.all('topic', 'user', 'parent_reply', 'reply_saved',
        function(topic, user, pReply, reply) {
        Reply.getTopicReplyCount(topic._id, ep.done(function(count) {
            topic.last_reply = reply._id;
            topic.last_reply_at = Date.now();
            topic.reply_count = count;
            topic.save(ep.done('topic_updated'));
        }));
        Reply.getAuthorReplyCount(user._id, ep.done(function(count) {
            user.score += 5;
            user.reply_count = count;
            user.save(ep.done('user_updated'));
        }));

        // 发送at消息，并防止重复 at 作者
        var newContent = reply.content.replace('@' + topic.author.loginname + ' ', '');
        at.sendMessageToMentionUsers(newContent, topic._id, user._id, reply._id);

        if (topic.author_id.toString() !== user._id.toString()) {
            if (!pReply) {
                // 一级评论给文章作者
                message.sendReplyMessage(
                    topic.author_id, user._id, topic._id, reply._id
                );
                mail.sendReplyMail(topic, topic.author, reply, user);
            } else {
                // 二级评论给文章作者
                message.sendReplyMessage(
                    topic.author_id, user._id, topic._id, reply._id
                );
                mail.sendSubReplyMail(
                    topic, topic.author, pReply, pReply.author, reply, user
                );
            }
        }
        // 二级评论消息给一级评论者
        // 如果一级评论者是文章作者跳过
        var wechatShowContent = renderHelper.htmlToText(reply.content);
        wechatShowContent = (wechatShowContent.length <= 10) ? wechatShowContent : wechatShowContent.substring(0, 15) + '...';
        if (pReply
            && pReply.author._id.toString() !== user._id.toString()
            && pReply.author._id.toString() !== topic.author_id.toString()
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
        'topic', 'user', 'reply_saved', 'topic_updated', 'user_updated',
        function(topic, user, reply) {
            reply.author = user;
            res.send({
                ret: 0,
                data: {
                    reply: dataAdapter.outReply(reply),
                    topic: {
                        reply_count: topic.reply_count
                    },
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
  var ep = EventProxy.create();
  ep.fail(next);
  ep.on('fail', function(ret, msg) {
    ep.unbind();
    res.send({ret: ret || 400, msg: msg || ''});
  });
  ep.on('done', function() {
    res.send({ret: 0});
  });
  Reply.getReplyById(reply_id, ep.done(function(reply) {
    if (!reply) {
        return ep.emit('fail', 401, 'no reply');
    }
    ep.emit('reply', reply);
  }));
  ep.all('reply', function(reply) {
    if (reply.reply_id) {
      Reply.getReplyById(reply.reply_id, ep.done(function(parent_reply) {
        ep.emit('parent_reply', parent_reply || null);
      }));
    } else {
        ep.emitLater('parent_reply', null);
    }
    Topic.getTopicById(reply.topic_id, ep.done(function(topic, author) {
       ep.emit('topic_author', author);
    }));
  });
  ep.all(
    'reply', 'parent_reply', 'topic_author',
    function(reply, parent_reply, topic_author) {
        var user = req.session.user;
        var hasPermission = user.is_admin
            // 评论者
            || tools.modelEqual(reply.author, user)
            // 一级评论者
            || (parent_reply && tools.modelEqual(parent_reply.author, user))
            // 文章作者
            || tools.modelEqual(topic_author, user);
        if (!hasPermission) {
            return ep.emit('fail', 404, 'no permission');
        }
        reply.remove();
        if (!parent_reply) {
          reply.author.score -= 5;
          reply.author.reply_count -= 1;
          reply.author.save();
          // 删除所有子评论
          Reply.removeByCondition({reply_id: reply_id});
        }
        Topic.reduceCount(reply.topic_id, _.noop);
        ep.emit('done');
    }
  );
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
    if (!reply) {
      res.render('notify/notify', {error: '此回复不存在或已被删除。'});
      return;
    }

    if (String(reply.author_id) === req.session.user._id.toString() || req.session.user.is_admin) {
      if (raw) {
          Reply.update(reply, raw, function(err) {
              if (err) {
                return next(err);
              }
              res.redirect('/topic/' + reply.topic_id + '#' + reply._id);
          });
      } else {
        res.render('notify/notify', {error: '回复的字数太少。'});
      }
    } else {
      res.render('notify/notify', {error: '对不起，你不能编辑此回复。'});
    }
  });
};

exports.up = function (req, res, next) {
    var replyId = req.params.reply_id;
    var cancel = req.body.cancel === 'true';
    var ep = EventProxy.create();
    ep.fail(next);
    ep.on('fail', function(ret, msg) {
        ep.unbind();
        res.send({ret: ret || 400, msg: msg || ''});
    });
    Reply.getReplyById(replyId, ep.done(function(reply) {
        if (!reply) {
            return ep.emit('fail');
        }
        var userId = req.session.user._id;
        // 不能帮自己点赞
        if (reply.author_id.equals(userId)) {
            return ep.emit('fail', 401, '不能帮自己点赞');
        }
        reply.ups = reply.ups || [];
        var upIndex = reply.ups.indexOf(userId);
        if (cancel && upIndex !== -1) {
            reply.ups.splice(upIndex, 1);
        } else if (!cancel && upIndex === -1) {
            reply.ups.push(userId);
        }
        reply.save(ep.done(function() {
            ep.emit('reply_updated', reply);
        }));
    }));
    ep.on('reply_updated', function(reply) {
        res.send({
            ret: 0,
            data: {
                reply: dataAdapter.outReply(reply)
            }
        });
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
