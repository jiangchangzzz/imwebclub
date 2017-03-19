var models = require('../models');
var Reply = models.Reply;
var EventProxy = require('eventproxy');

var tools = require('../common/tools');
var renderHelper = require('../common/render_helper');
var User = require('./user');
var at = require('../common/at');

/**
 * 获取一条回复信息
 * @param {String} id 回复ID
 * @param {Function} callback 回调函数
 */
exports.getReply = function (id, callback) {
  Reply.findOne({_id: id}, callback);
};

/**
 * 根据回复ID，获取回复
 * Callback:
 * - err, 数据库异常
 * - reply, 回复内容
 * @param {String} id 回复ID
 * @param {Function} callback 回调函数
 */
exports.getReplyById = function (id, callback) {
  Reply.findOne({_id: id}, function (err, reply) {
    if (err) {
      return callback(err);
    }
    if (!reply) {
      return callback(err, null);
    }

    var author_id = reply.author_id;
    User.getUserById(author_id, function (err, author) {
      if (err) {
        return callback(err);
      }
      reply.author = author;
      reply.friendly_create_at = tools.formatDate(reply.create_at, true);
      // TODO: 添加更新方法，有些旧帖子可以转换为markdown格式的内容
      if (reply.content_is_html) {
        return callback(null, reply);
      }
      at.linkUsers(reply.content, function (err, str) {
        if (err) {
          return callback(err);
        }
        reply.content = str;
        return callback(err, reply);
      });
    });
  });
};

/**
 * 根据topicId查询到最新的一条未删除回复
 * @param topicId 主题ID
 * @param callback 回调函数
 */
exports.getLastReplyByTopId = function (topicId, callback) {
  Reply.find({topic_id: topicId, deleted: false}, '_id', {sort: {create_at : -1}, limit : 1}, callback);
};

/**
 * 根据主题ID，获取回复列表
 * Callback:
 * - err, 数据库异常
 * - replies, 回复列表
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getRepliesByTopicId = function (id, cb) {
  Reply.find({topic_id: id}, '', {sort: 'create_at'}, function (err, replies) {
    if (err) {
      return cb(err);
    }
    if (replies.length === 0) {
      return cb(null, []);
    }

    var proxy = new EventProxy();
    proxy.after('reply_find', replies.length, function () {
      cb(null, replies);
    });
    for (var j = 0; j < replies.length; j++) {
      (function (i) {
        var author_id = replies[i].author_id;
        User.getUserById(author_id, function (err, author) {
          if (err) {
            return cb(err);
          }
          // console.log(author);
          replies[i].author = author || { _id: '' };
          replies[i].friendly_create_at = tools.formatDate(replies[i].create_at, true);
          if (replies[i].content_is_html) {
            return proxy.emit('reply_find');
          }
          at.linkUsers(replies[i].content, function (err, str) {
            if (err) {
              return cb(err);
            }
            replies[i].content = str;
            proxy.emit('reply_find');
          });
        });
      })(j);
    }
  });
};

/**
 * 创建并保存一条回复信息
 * @param {String} raw 回复内容markdown
 * @param {String} topicId 主题ID
 * @param {String} authorId 回复作者
 * @param {String} [replyId] 回复ID，当二级回复时设定该值
 * @param {Function} callback 回调函数
 */
exports.newAndSave = function (raw, topicId, authorId, replyId, callback) {
    if (typeof replyId === 'function') {
        callback = replyId;
        replyId = null;
    }
    var reply = new Reply();
    reply.raw = raw;
    reply.content = renderHelper.markdownRender(raw);
    reply.text = tools.genReplyText(reply.content);
    reply.topic_id = topicId;
    reply.author_id = authorId;
    if (replyId) {
        reply.reply_id = replyId;
    }
    reply.save(function (err) {
        callback(err, reply);
    });
};

/**
 * 更新评论
 * @param {String} raw 回复内容markdown
 */
exports.update = function(reply, raw, cb) {
    reply.raw = raw;
    reply.content = renderHelper.markdownRender(raw);
    reply.text = tools.genReplyText(reply.content);
    reply.save(cb);
};

exports.getRepliesByAuthorId = function (authorId, opt, callback) {
  if (!callback) {
    callback = opt;
    opt = null;
  }
  Reply.find({author_id: authorId}, {}, opt, callback);
};

// 通过 author_id 获取回复总数
exports.getCountByAuthorId = function (authorId, callback) {
  Reply.count({author_id: authorId}, callback);
};

/**
 * 删除
 */
exports.removeByCondition = function (query, callback) {
    Reply.remove(query).exec();
};

/**
 * 查询用户某时间点之前创建的reply
 */
exports.queryAuthorReply = function(authorId, beforeTime, limit, callback) {
    Reply.find({
        author_id: authorId,
        create_at: {
            $lt: beforeTime
        }
    })
    .populate('topic_id')
    .sort('-create_at')
    .limit(limit)
    .exec(callback);
};

/**
 * 查询回复
 */
exports.replyList = function(callback) {
    Reply.find({}, callback);
};

exports.replyList2 = function(callback) {
    Reply.find({}, function(err, results){
        callback && callback(results);
    });
};

/**
 * 获取文章评论数
 */
exports.getTopicReplyCount = function(topicId, callback) {
    Reply.count({topic_id: topicId}, callback);
};

/**
 * 获取用户评论数
 */
exports.getAuthorReplyCount = function(authorId, callback) {
    Reply.count({author_id: authorId}, callback);
};
