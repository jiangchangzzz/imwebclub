var validator = require('validator');
var at = require('../common/at');
var User = require('../proxy').User;
var Question = require('../proxy').Question;
var EventProxy = require('eventproxy');
var tools = require('../common/tools');
var store = require('../common/store');
var config = require('../config');
var _ = require('lodash');
var cache = require('../common/cache');
var logger = require('../common/logger');
var escapeHtml = require('escape-html');
var mail = require('../common/mail');
var dataAdapter = require('../common/dataAdapter');
var renderHelper = require('../common/render_helper');

/**
 * Question page
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 * @param  {Function} next
 */
exports.index = function (req, res, next) {
  function isUped(user, reply) {
    if (!reply.ups) {
      return false;
    }
    return reply.ups.indexOf(user._id) !== -1;
  }

  var question_id = req.params.qid;
  var currentUser = req.session.user;

  if (question_id.length !== 24) {
    return res.render404('此话题不存在或已被删除。');
  }
  var events = ['question', 'other_questions', 'no_reply_questions', 'is_collect'];
  var ep = EventProxy.create(events,
    function (question, other_questions, no_reply_questions, is_collect) {
      res.render('question/index', {
        question: question,
        author_other_questions: other_questions,
        no_reply_questions: no_reply_questions,
        is_uped: isUped,
        is_collect: is_collect,
        tabs: config.tabs
      });
    });

  ep.fail(next);

  Question.getFullQuestion(question_id, ep.done(function (message, question, author, replies) {
    if (message) {
      logger.error('getFullQuestion error question_id: ' + question_id)
      return res.renderError(message);
    }

    question.visit_count += 1;
    question.save();

    // format date
    question.friendly_create_at = tools.formatDate(question.create_at, true);
    question.friendly_update_at = tools.formatDate(question.update_at, true);

    question.author = author;

    var mainReplies = dataAdapter.appendSubRepliesToReplies(replies);
    question.replies = dataAdapter.outReplies(mainReplies);

    // 点赞数排名第三的回答，它的点赞数就是阈值
    question.reply_up_threshold = (function () {
      var allUpCount = replies.map(function (reply) {
        return reply.ups && reply.ups.length || 0;
      });
      allUpCount = _.sortBy(allUpCount, Number).reverse();

      var threshold = allUpCount[2] || 0;
      if (threshold < 3) {
        threshold = 3;
      }
      return threshold;
    })();

    ep.emit('question', question);

    // get other_questions
    var options = { limit: 5, sort: '-last_reply_at' };
    var query = { author_id: question.author_id, _id: { '$nin': [question._id] } };
    Question.getQuestionsByQuery(query, options, ep.done('other_questions'));

    // get no_reply_questions
    cache.get('no_reply_questions', ep.done(function (no_reply_questions) {
      if (no_reply_questions) {
        ep.emit('no_reply_questions', no_reply_questions);
      } else {
        Question.getQuestionsByQuery(
          { reply_count: 0, tab: { $ne: 'job' } },
          { limit: 5, sort: '-create_at' },
          ep.done('no_reply_questions', function (no_reply_questions) {
            cache.set('no_reply_questions', no_reply_questions, 60 * 1);
            return no_reply_questions;
          }));
      }
    }));
  }));

  if (!currentUser) {
    ep.emit('is_collect', null);
  } else {
    QuestionCollect.getQuestionCollect(currentUser._id, question_id, ep.done('is_collect'));
  }
};


exports.create = function (req, res, next) {
  res.render('question/edit', {
    tabs: config.tabs
  });
};


exports.put = function (req, res, next) {
  var title   = validator.trim(req.body.title);
  var tab     = validator.trim(req.body.tab);
  var content = validator.trim(req.body.t_content);

  var allTabs = config.tabs.map(function (tPair) {
    return tPair[0];
  });

  // 验证
  var editError;
  if (title === '') {
    editError = '标题不能是空的。';
  } else if (title.length < 5 || title.length > 100) {
    editError = '标题字数太多或太少。';
  } else if (!tab || allTabs.indexOf(tab) === -1) {
    editError = '必须选择一个版块。';
  } else if (content === '') {
    editError = '内容不可为空';
  }
  // END 验证

  if (editError) {
    res.status(422);
    return res.render('question/edit', {
      edit_error: editError,
      title: title,
      content: content,
      tabs: config.tabs
    });
  }

  Question.newAndSave(title, content, tab, req.session.user._id, function (err, question) {
    if (err) {
      return next(err);
    }

    var proxy = new EventProxy();

    proxy.all('count_saved', function () {
      res.redirect('/question/' + question._id);
    });
    proxy.fail(next);
    User.getUserById(req.session.user._id, proxy.done(function (user) {
    //   user.score += 5;
      user.question_count += 1;
      user.save();
      req.session.user = user;
      proxy.emit('count_saved');
    }));

    //发送at消息
    // at.sendMessageToMentionUsers(content, question._id, req.session.user._id);
  });
}  