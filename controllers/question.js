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

    // proxy.all('score_saved', function () {
    //   res.redirect('/topic/' + topic._id);
    // });
    // proxy.fail(next);
    // User.getUserById(req.session.user._id, proxy.done(function (user) {
    //   user.score += 5;
    //   user.topic_count += 1;
    //   user.save();
    //   req.session.user = user;
    //   proxy.emit('score_saved');
    // }));

    //发送at消息
    // at.sendMessageToMentionUsers(content, topic._id, req.session.user._id);
  });
}  