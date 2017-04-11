var EventProxy = require('eventproxy');
var models = require('../models');
var Activity = models.Activity;
var User = require('./user');
var Reply = require('./reply');
var tools = require('../common/tools');
var at = require('../common/at');
var _ = require('lodash');
var config = require('../config');
var tools = require('../common/tools');


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
exports.getActivityById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['activity', 'author', 'last_reply'];
  proxy.assign(events, function (activity, author, last_reply) {
    if (!author) {
      return callback(null, null, null, null);
    }
    return callback(null, activity, author, last_reply);
  }).fail(callback);

  Activity.findOne({ _id: id }, proxy.done(function (activity) {
    if (!activity) {
      proxy.emit('activity', null);
      proxy.emit('author', null);
      proxy.emit('last_reply', null);
      return;
    }
    proxy.emit('activity', activity);

    User.getUserById(activity.author_id, proxy.done('author'));

    if (activity.last_reply) {
      Reply.getReplyById(activity.last_reply, proxy.done(function (last_reply) {
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
  Activity.count(query, callback);
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
exports.getActivitiesByQuery = function (query, opt, callback) {
  query.deleted = false;
  Activity.find(query, {}, opt, function (err, activities) {
    if (err) {
      return callback(err);
    }
    if (activities.length === 0) {
      return callback(null, []);
    }
    // console.log(activities);
    var proxy = new EventProxy();
    proxy.after('activity_ready', activities.length, function () {
      activities = _.compact(activities); // 删除不合规的 activity
      return callback(null, activities);
    });
    proxy.fail(callback);

    activities.forEach(function (activity, i) {
      var ep = new EventProxy();
      ep.all('author', 'reply', function (author, reply) {
        // 保证顺序
        // 作者可能已被删除
        if (author) {
          activity.author = author;
          activity.reply = reply;
          activity.friendly_create_at = tools.formatDate(activity.create_at, true);
        } else {
          activities[i] = null;
        }
        proxy.emit('activity_ready');
      });

      User.getUserById(activity.author_id, ep.done('author'));
      // 获取主题的最后回复
      Reply.getReplyById(activity.last_reply, ep.done('reply'));
    });
  });
};

// for sitemap
exports.getLimit5w = function (callback) {
  Activity.find({ deleted: false }, '_id', { limit: 50000, sort: '-create_at' }, callback);
};

/**
 * 获取所有信息的主题
 * Callback:
 * - err, 数据库异常
 * - message, 消息
 * - activity, 主题
 * - author, 主题作者
 * - replies, 主题的回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getFullActivity = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['activity', 'author', 'replies'];
  proxy
    .assign(events, function (activity, author, replies) {
      callback(null, '', activity, author, replies);
    })
    .fail(callback);

  Activity.findOne({ _id: id, deleted: false }, proxy.done(function (activity) {
    if (!activity) {
      proxy.unbind();
      return callback(null, '此话题不存在或已被删除。');
    }
    at.linkUsers(activity.content, proxy.done('activity', function (str) {
      activity.linkedContent = str;
      return activity;
    }));

    User.getUserById(activity.author_id, proxy.done(function (author) {
      if (!author) {
        proxy.unbind();
        return callback(null, '话题的作者丢了。');
      }
      proxy.emit('author', author);
    }));

    Reply.getRepliesByActivityId(activity._id, proxy.done('replies'));
  }));
};

/**
 * 更新主题的最后回复信息
 * @param {String} activityId 主题ID
 * @param {String} replyId 回复ID
 * @param {Function} callback 回调函数
 */
exports.updateLastReply = function (activityId, replyId, callback) {
  Activity.findOne({ _id: activityId }, function (err, activity) {
    if (err || !activity) {
      return callback(err);
    }
    activity.last_reply = replyId;
    activity.last_reply_at = new Date();
    activity.reply_count += 1;
    activity.save(callback);
  });
};

/**
 * 根据主题ID，查找一条主题
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getActivity = function (id, callback) {
  Activity.findOne({ _id: id }, callback);
};

/**
 * 将当前主题的回复计数减1，并且更新最后回复的用户，删除回复时用到
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.reduceCount = function (id, callback) {
  Activity.findOne({ _id: id }, function (err, activity) {
    if (err) {
      return callback(err);
    }

    if (!activity) {
      return callback(new Error('该主题不存在'));
    }
    activity.reply_count -= 1;

    Reply.getLastReplyByParentId(id, function (err, reply) {
      if (err) {
        return callback(err);
      }

      if (reply.length !== 0) {
        activity.last_reply = reply[0]._id;
      } else {
        activity.last_reply = null;
      }

      activity.save(callback);
    });

  });
};

exports.newAndSave = function (title, tab, content, begin_time, begin_str, end_time, end_str, location_str, authorId, callback) {
  var activity = new Activity();
  activity.title = title;
  activity.tab = tab;
  activity.content = content;
  activity.pic = tools.genPicFromContent(content);
  activity.begin_time = begin_time;
  activity.begin_str = begin_str;
  activity.end_time = end_time;
  activity.end_str = end_str;
  activity.location_str = location_str;
  activity.author_id = authorId;
  activity.save(callback);
};


// exports.newAndSave = function (title, content, tab, authorId, callback) {
//   var activity       = new Activity();
//   activity.title     = title;
//   activity.content   = content;
//   activity.tab       = tab;
//   activity.author_id = authorId;

//   activity.save(callback);
// };

/**
 * 查询用户某时间点之前创建的activity
 */
exports.queryAuthorActivity = function (authorId, beforeTime, limit, callback) {
  Activity.find({
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
