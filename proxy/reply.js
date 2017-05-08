var models = require('../models');
var Reply = models.Reply;
var EventProxy = require('eventproxy');
var _ = require('lodash');
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
 * 根据parentId查询到最新的一条未删除回复
 * @param parentId 主题ID
 * @param callback 回调函数
 */
exports.getLastReplyByParentId = function (parentId, callback) {
  Reply.find({topic_id: parentId, deleted: false}, '', {sort: {create_at : -1}, limit : 1}, callback);
};

exports.getTopReplyByParentId = function (parentId, callback) {
  Reply.find({topic_id: parentId, deleted: false, top: true}, '', {limit : 1}, callback);
};

/**
 * 根据主题ID，获取回复列表
 * Callback:
 * - err, 数据库异常
 * - replies, 回复列表
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getRepliesByParentId = function (parentId, sorts, callback) {
  var sort = {
    top: -1
  };
  if(sorts){
    sort = _.extend(sort, sorts);
  }
  Reply.find({topic_id: parentId, deleted: {$in:[null,false]}}, '', {sort: sort}, function (err, replies) {
    if (err) {
      return callback(err);
    }
    if (replies.length === 0) {
      return callback(null, []);
    }

    var proxy = new EventProxy();
    proxy.after('reply_ready', replies.length, function () {
      callback(null, replies);
    });
    replies.forEach(function (reply, i) {
      var ep = new EventProxy();
      var author_id = reply.author_id;
      var reply_id = reply._id;
      ep.all('reply_find', function () {
        proxy.emit('reply_ready');
      });
      User.getUserById(author_id, function (err, author) {
        if (err) {
          return callback(err);
        }
        // console.log(author);
        reply.author = author || { _id: '' };
        reply.friendly_create_at = tools.formatDate(reply.create_at, true);
        if (reply.content_is_html) {
          return ep.emit('reply_find');
        }
        at.linkUsers(reply.content, function (err, str) {
          if (err) {
            return callback(err);
          }
          reply.content = str;
          ep.emit('reply_find');
        });
      });
    });
  });
};
exports.getParentReplyCount = function(parentId, callback) {
    Reply.count({topic_id: parentId}, callback);
};
/**
 * 创建并保存一条回复信息
 * @param {String} raw 回复内容markdown
 * @param {String} parentId 主题ID
 * @param {String} authorId 回复作者
 * @param {String} [replyId] 回复ID，当二级回复时设定该值
 * @param {Function} callback 回调函数
 */
exports.newAndSave = function (kind, raw, parentId, authorId, replyId, callback) {
    if (typeof replyId === 'function') {
        callback = replyId;
        replyId = null;
    }
    var reply = new Reply();
    reply.raw = raw;
    reply.content = renderHelper.markdownRender(raw);
    reply.text = tools.genReplyText(reply.content);
    reply.topic_id = parentId;
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

exports.getRepliesByAuthorId = function (authorId, kind, opt, callback) {
  if (!callback) {
    callback = opt;
    opt = null;
  }
  if(kind && kind !== 'all'){
    Reply.find({author_id: authorId, kind: kind}, {}, opt, callback);
  }else{
    Reply.find({author_id: authorId}, {}, opt, callback);
  }
};

// 通过 author_id 获取回复总数
exports.getCountByAuthorId = function (authorId, kind, callback) {
  if(kind && kind !== 'all'){
    Reply.count({author_id: authorId, kind: kind, deleted: false}, callback);
  } else {
    Reply.count({author_id: authorId, deleted: false}, callback);
  }
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
exports.queryAuthorReply = function(authorId, kind, beforeTime, limit, callback) {
    var query = {
        author_id: authorId,
        deleted: false,
        create_at: {
            $lt: beforeTime
        }
    };
    if(kind && kind !== 'all'){
      query.kind = kind;
    }
    Reply.find(query)
    .populate('parent_id')
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
