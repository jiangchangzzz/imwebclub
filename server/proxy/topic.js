var EventProxy = require('eventproxy');
var models = require('../models');
var Topic = models.Topic;
var User = require('./user');
var Reply = require('./reply');
var tools = require('../common/tools');
var at = require('../common/at');
var _ = require('lodash');
var config = require('../config');
var dataAdapter = require('../common/dataAdapter');

/**
 * 根据主题ID获取主题
 * Callback:
 * - err, 数据库错误
 * - topic, 主题
 * - author, 作者
 * - lastReply, 最后回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getTopicById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'author', 'last_reply'];
  proxy.assign(events, function (topic, author, last_reply) {
    /*if (!author) {
      return callback(null, null, null, null);
    }*/   //TODO
    return callback(null, topic, author, last_reply);
  }).fail(callback);

  Topic.findOne({ _id: id }, proxy.done(function (topic) {
    if (!topic) {
      proxy.emit('topic', null);
      proxy.emit('author', null);
      proxy.emit('last_reply', null);
      return;
    }
    proxy.emit('topic', topic);

    User.getUserById(topic.author_id, proxy.done('author'));

    if (topic.last_reply) {
      Reply.getReplyById(topic.last_reply, proxy.done(function (last_reply) {
        proxy.emit('last_reply', last_reply);
      }));
    } else {
      proxy.emit('last_reply', null);
    }
  }));
};

/**
 * 获取关键词能搜索到的主题数量
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
  Topic.count(query, callback);
};

/**
 * 根据关键词，获取主题列表
 * Callback:
 * - err, 数据库错误
 * - count, 主题列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 * @param {Function} callback 回调函数
 */
exports.getTopicsByQuery = function (query, opt, callback) { 
  query.deleted = {$in:[null,false]};
  Topic.find(query, {}, opt, function (err, topics) {
    if (err) {
      return callback(err);
    }
    if (topics.length === 0) {
      return callback(null, []);
    }
    var proxy = new EventProxy();
    proxy.after('topic_ready', topics.length, function () {
      topics = _.compact(topics); // 删除不合规的 topic
      return callback(null, topics);
    });
    proxy.fail(callback);

    topics.forEach(function (topic, i) {
      var ep = new EventProxy();
      ep.all('author', 'reply', function (author, reply) {
        // 保证顺序
        // 作者可能已被删除
        if (author) {
          // topic.author = author;
          topic.author = dataAdapter.outUser(author || {});
          topic.reply = reply;
          topic.friendly_create_at = tools.formatDate(topic.create_at, true);
          topic.friendly_update_at = tools.formatDate(topic.update_at, true);
        } else {
          topics[i] = null;
        }
        proxy.emit('topic_ready');
      });

      User.getUserById(topic.author_id, ep.done('author'));
      // 获取主题的最后回复
      if(topic.last_reply) {
        Reply.getReplyById(topic.last_reply, ep.done('reply'));
      } else {
        Reply.getLastReplyByParentId(topic._id, ep.done('reply'));
      }
    });
  });
};

// for sitemap
// exports.getLimit5w = function (callback) {
//   Topic.find({ deleted: false }, '_id', { limit: 50000, sort: '-create_at' }, callback);
// };

/**
 * 获取所有信息的主题
 * Callback:
 * - err, 数据库异常
 * - message, 消息
 * - topic, 主题
 * - author, 主题作者
 * - replies, 主题的回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getFullTopic = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['topic', 'author', 'replies'];
  proxy
    .assign(events, function (topic, author, replies) {
      topic.reply_count = replies.length;//校正回复计数
      callback(null, '', topic, author, replies);
    })
    .fail(callback);

  Topic.findOne({ _id: id, deleted: {$in:[false,null]} }, proxy.done(function (topic) {
    if (!topic) {
      proxy.unbind();
      return callback(null, '此话题不存在或已被删除。');
    }
    at.linkUsers(topic.content, proxy.done('topic', function (str) {
      topic.linkedContent = str;
      return topic;
    }));

    User.getUserById(topic.author_id, proxy.done(function (author) {
      if (!author) {
        proxy.unbind();
        return callback(null, '话题的作者丢了。');
      }
      proxy.emit('author', author);
    }));

    Reply.getRepliesByParentId(topic._id, {score:-1}, proxy.done('replies'));
  }));
};

/**
 * 更新主题的最后回复信息
 * @param {String} topicId 主题ID
 * @param {String} replyId 回复ID
 * @param {Function} callback 回调函数
 */
exports.updateLastReply = function (topicId, replyId, callback) {
  Topic.findOne({ _id: topicId }, function (err, topic) {
    if (err || !topic) {
      return callback(err);
    }
    topic.last_reply = replyId;
    topic.last_reply_at = new Date();
    topic.reply_count += 1;
    topic.save(callback);
  });
};

/**
 * 根据主题ID，查找一条主题
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getTopic = function (id, callback) {
  Topic.findOne({ _id: id }, callback);
};

/**
 * 将当前主题的回复计数减1，并且更新最后回复的用户，删除回复时用到
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.reduceCount = function (id, callback) {
  Topic.findOne({ _id: id }, function (err, topic) {
    if (err) {
      return callback(err);
    }

    if (!topic) {
      return callback(new Error('该主题不存在'));
    }
    topic.reply_count -= 1;

    Reply.getLastReplyByParentId(id, function (err, reply) {
      if (err) {
        return callback(err);
      }

      if (reply.length !== 0) {
        topic.last_reply = reply[0]._id;
      } else {
        topic.last_reply = null;
      }

      topic.save(callback);
    });

  });
};

exports.newAndSave = function (title, type, content, tab, cover, reprint, authorId, callback) {
  type = type || 0;
  var topic = new Topic();
  topic.type = type;
  topic.title = title;
  topic.content = content;
  topic.pic = tools.genPicFromContent(content);
  topic.summary = tools.genSummaryFromContent(content, config.topic_summary_len);
  topic.tab = tab;
  topic.cover = cover;
  topic.reprint = reprint;
  topic.author_id = authorId;
  topic.save(callback);
};


// exports.newAndSave = function (title, content, tab, authorId, callback) {
//   var topic       = new Topic();
//   topic.title     = title;
//   topic.content   = content;
//   topic.tab       = tab;
//   topic.author_id = authorId;

//   topic.save(callback);
// };

/**
 * 查询用户某时间点之前创建的topic
 */
exports.queryAuthorTopic = function (authorId, beforeTime, limit, callback) {
  Topic.find({
    author_id: authorId,
    create_at: {
      $lt: beforeTime
    }
  })
    .populate('draft')
    .sort('-create_at')
    .limit(limit)
    .exec(callback);
};

/**
 * 获取用户文章数量
 */
exports.getTopicCount=function(authorId){
  return Topic.count({
    author_id: authorId
  }).exec();
};

/**
 * 更新文章数据
 */
exports.removeTopicFromNotebook=function(notebookId){
  return Topic.update({notebook: notebookId},{notebook: null})
    .exec();
}

/**
 * 获取文集中的文章
 */
exports.getTopicByNotebookId=function(userId,notebookId){
  return Topic.find({
    author_id: userId,
    notebook: notebookId,
    deleted: false
  })
  .exec();
}

/**
 * 获取未分类的文章
 */
exports.getUnSortedTopic=function(userId){
  return Topic.find({ 
    author_id: userId,
    deleted: false
  })
  .where('notebook').in([undefined,null])
  .exec();
}
