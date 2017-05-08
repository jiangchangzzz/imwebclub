var models = require('../models');
var Comment = models.Comment;
var QuestionAnswer = require('./question_answer');
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
exports.getComment = function (id, callback) {
  Comment.findOne({_id: id}, callback);
};

/**
 * 根据回复ID，获取回复
 * Callback:
 * - err, 数据库异常
 * - comment, 回复内容
 * @param {String} id 回复ID
 * @param {Function} callback 回调函数
 */
exports.getCommentById = function (id, callback) {
  Comment.findOne({_id: id}, function (err, comment) {
    if (err) {
      return callback(err);
    }
    if (!comment) {
      return callback(err, null);
    }

    var author_id = comment.author_id;
    User.getUserById(author_id, function (err, author) {
      if (err) {
        return callback(err);
      }
      comment.author = author;
      comment.friendly_create_at = tools.formatDate(comment.create_at, true);
      // TODO: 添加更新方法，有些旧帖子可以转换为markdown格式的内容
      if (comment.content_is_html) {
        return callback(null, comment);
      }
      at.linkUsers(comment.content, function (err, str) {
        if (err) {
          return callback(err);
        }
        comment.content = str;
        return callback(err, comment);
      });
    });
  });
};

/**
 * 根据parentId查询到最新的一条未删除回复
 * @param parentId 主题ID
 * @param callback 回调函数
 */
exports.getLastCommentByParentId = function (parentId, callback) {
  Comment.find({parent_id: parentId, deleted: false}, '', {sort: {create_at : -1}, limit : 1}, callback);
};

exports.getTopCommentByParentId = function (parentId, callback) {
  Comment.find({parent_id: parentId, deleted: false, top: true}, '', {limit : 1}, callback);
};

/**
 * 根据主题ID，获取回复列表
 * Callback:
 * - err, 数据库异常
 * - replies, 回复列表
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getCommentsByParentId = function (parentId, sorts, callback) {
  var sort = {
    top: -1
  };
  if(sorts){
    sort = _.extend(sort, sorts);
  }
  Comment.find({parent_id: parentId, deleted: false}, '', {sort: sort}, function (err, replies) {
    //console.log(replies);
    if (err) {
      return callback(err);
    }
    if (replies.length === 0) {
      return callback(null, []);
    }

    var proxy = new EventProxy();
    proxy.after('comment_ready', replies.length, function () {
      callback(null, replies);
    });
    replies.forEach(function (comment, i) {
      var ep = new EventProxy();
      var author_id = comment.author_id;
      var comment_id = comment._id;
      ep.all('comment_find', 'answer', function () {
        proxy.emit('comment_ready');
      });
      User.getUserById(author_id, function (err, author) {
        if (err) {
          return callback(err);
        }
        // console.log(author);
        comment.author = author || { _id: '' };
        comment.friendly_create_at = tools.formatDate(comment.create_at, true);
        if (comment.content_is_html) {
          return ep.emit('comment_find');
        }
        at.linkUsers(comment.content, function (err, str) {
          if (err) {
            return callback(err);
          }
          comment.content = str;
          ep.emit('comment_find');
        });
      });
      QuestionAnswer.getQuestionAnswer(parentId, comment_id, function (err, question_answer) {
        if (err || !question_answer) {
          comment.answer = false;
        } else {
          comment.answer = true;
        }
        return ep.emit('answer');
      });
    });
  });
};
exports.getParentCommentCount = function(parentId, callback) {
    Comment.count({parent_id: parentId}, callback);
};
/**
 * 创建并保存一条回复信息
 * @param {String} raw 回复内容markdown
 * @param {String} parentId 主题ID
 * @param {String} authorId 回复作者
 * @param {String} [commentId] 回复ID，当二级回复时设定该值
 * @param {Function} callback 回调函数
 */
exports.newAndSave = function (kind ,raw, parentId, authorId, commentId, callback) {
    if (typeof commentId === 'function') {
        callback = commentId;
        commentId = null;
    }
    var comment = new Comment();
    comment.kind = kind;
    comment.raw = raw;
    comment.content = renderHelper.markdownRender(raw);
    comment.text = tools.genCommentText(comment.content);
    comment.parent_id = parentId;
    comment.author_id = authorId;
    if (commentId) {
        comment.comment_id = commentId;
    }
    comment.save(function (err) {
        callback(err, comment);
    });
};

/**
 * 更新评论
 * @param {String} raw 回复内容markdown
 */
exports.update = function(comment, raw, cb) {
    comment.raw = raw;
    comment.content = renderHelper.markdownRender(raw);
    comment.text = tools.genCommentText(comment.content);
    comment.save(cb);
};

exports.getCommentsByAuthorId = function (authorId, kind, opt, callback) {
  if (!callback) {
    callback = opt;
    opt = null;
  }
  if(kind && kind !== 'all'){
    Comment.find({author_id: authorId, kind: kind}, {}, opt, callback);
  }else{
    Comment.find({author_id: authorId}, {}, opt, callback);
  }
};

// 通过 author_id 获取回复总数
exports.getCountByAuthorId = function (authorId, kind, callback) {
  if(kind && kind !== 'all'){
    Comment.count({author_id: authorId, kind: kind, deleted: false}, callback);
  } else {
    Comment.count({author_id: authorId, deleted: false}, callback);
  }
};

/**
 * 删除
 */
exports.removeByCondition = function (query, callback) {
    Comment.remove(query).exec();
};

/**
 * 查询用户某时间点之前创建的comment
 */
exports.queryAuthorComment = function(authorId, kind, beforeTime, limit, callback) {
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
    Comment.find(query)
    .populate('parent_id')
    .sort('-create_at')
    .limit(limit)
    .exec(callback);
};

/**
 * 查询回复
 */
exports.commentList = function(callback) {
    Comment.find({}, callback);
};

exports.commentList2 = function(callback) {
    Comment.find({}, function(err, results){
        callback && callback(results);
    });
};
