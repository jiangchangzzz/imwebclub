var EventProxy = require('eventproxy');
var models     = require('../models');
var Question      = models.Question;
var User       = require('./user');
var Reply      = require('./reply');
var tools      = require('../common/tools');
var at         = require('../common/at');
var _          = require('lodash');
var config     = require('../config');

/**
 * 根据主题ID获取主题
 * Callback:
 * - err, 数据库错误
 * - question, 主题
 * - author, 作者
 * - lastReply, 最后回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getQuestionById = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['question', 'author', 'last_reply'];
  proxy.assign(events, function (question, author, last_reply) {
    if (!author) {
      return callback(null, null, null, null);
    }
    return callback(null, question, author, last_reply);
  }).fail(callback);

  Question.findOne({_id: id}, proxy.done(function (question) {
    if (!question) {
      proxy.emit('question', null);
      proxy.emit('author', null);
      proxy.emit('last_reply', null);
      return;
    }
    proxy.emit('question', question);

    User.getUserById(question.author_id, proxy.done('author'));

    if (question.last_reply) {
      Reply.getReplyById(question.last_reply, proxy.done(function (last_reply) {
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
  Question.count(query, callback);
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
exports.getQuestionsByQuery = function (query, opt, callback) {
  query.deleted = false;
  Question.find(query, {}, opt, function (err, questions) {
    if (err) {
      return callback(err);
    }
    if (questions.length === 0) {
      return callback(null, []);
    }

    var proxy = new EventProxy();
    proxy.after('question_ready', questions.length, function () {
      questions = _.compact(questions); // 删除不合规的 question
      return callback(null, questions);
    });
    proxy.fail(callback);

    questions.forEach(function (question, i) {
      var ep = new EventProxy();
      ep.all('author', 'last_reply', 'answer', function (author, last_reply, answer) {
        // 保证顺序
        // 作者可能已被删除
        question.author = author;
        question.last_reply = last_reply.length>0 ? last_reply[0] : null;
        question.answer = answer.length>0 ? answer[0] : null;
        proxy.emit('question_ready');
      });

      User.getUserById(question.author_id, ep.done('author'));
      Reply.getLastReplyByParentId(question._id, ep.done('last_reply'));
      Reply.getTopReplyByParentId(question._id, ep.done('answer'));
    });
  });
};

// for sitemap
exports.getLimit5w = function (callback) {
  Question.find({deleted: false}, '_id', {limit: 50000, sort: '-create_at'}, callback);
};

/**
 * 获取所有信息的主题
 * Callback:
 * - err, 数据库异常
 * - message, 消息
 * - question, 主题
 * - author, 主题作者
 * - replies, 主题的回复
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getFullQuestion = function (id, callback) {
  var proxy = new EventProxy();
  var events = ['question', 'author', 'replies'];
  proxy
    .assign(events, function (question, author, replies) {

      callback(null, '', question, author, replies);
    })
    .fail(callback);

  Question.findOne({_id: id, deleted: false}, proxy.done(function (question) {
    if (!question) {
      proxy.unbind();
      return callback(null, '此话题不存在或已被删除。');
    }
    at.linkUsers(question.content, proxy.done('question', function (str) {
      question.linkedContent = str;
      return question;
    }));

    User.getUserById(question.author_id, proxy.done(function (author) {
      if (!author) {
        proxy.unbind();
        return callback(null, '话题的作者丢了。');
      }
      proxy.emit('author', author);
    }));

    Reply.getRepliesByParentId(question._id, {score:-1,create_at: 1}, proxy.done('replies'));
  }));
};

/**
 * 更新主题的最后回复信息
 * @param {String} questionId 主题ID
 * @param {String} replyId 回复ID
 * @param {Function} callback 回调函数
 */
exports.updateLastReply = function (questionId, replyId, callback) {
  Question.findOne({_id: questionId}, function (err, question) {
    if (err || !question) {
      return callback(err);
    }
    question.last_reply    = replyId;
    question.last_reply_at = new Date();
    question.reply_count += 1;
    question.save(callback);
  });
};

/**
 * 根据主题ID，查找一条主题
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.getQuestion = function (id, callback) {
  Question.findOne({_id: id}, callback);
};

/**
 * 将当前主题的回复计数减1，并且更新最后回复的用户，删除回复时用到
 * @param {String} id 主题ID
 * @param {Function} callback 回调函数
 */
exports.reduceCount = function (id, callback) {
  Question.findOne({_id: id}, function (err, question) {
    if (err) {
      return callback(err);
    }

    if (!question) {
      return callback(new Error('该主题不存在'));
    }
    question.reply_count -= 1;

    Reply.getLastReplyByParentId(id, function (err, reply) {
      if (err) {
        return callback(err);
      }

      if (reply.length !== 0) {
        question.last_reply = reply[0]._id;
      } else {
        question.last_reply = null;
      }

      question.save(callback);
    });

  });
};

exports.newAndSave = function (title, tab, content, authorId, callback) {
  var question       = new Question();
  question.title     = title;
  question.content   = content;
  question.tab       = tab;
  question.author_id = authorId;
  question.pic = tools.genPicFromContent(content);
  question.summary = tools.genSummaryFromContent(content, config.question_summary_len);
  question.save(callback);
};
