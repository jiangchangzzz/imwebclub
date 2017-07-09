'use strict';
var Promise=require('bluebird');

var Message = require('../proxy').Message;
var SystemMessage = require('../proxy').SystemMessage;

//获取总消息数量中间件
function messageCount(req, res, next) {
  if (!req.session.user) {
    return next();
  }

  var getMessagesCount=Promise.promisify(Message.getMessagesCount);
  var userId = req.session.user._id;

  Promise.all([
    getMessagesCount(userId),
    SystemMessage.getNoReadSystemMessageByUserId(userId)
  ])
  .spread(function (messageCount, systemCount) {
    res.locals.messageCount = messageCount;
    res.locals.systemCount = systemCount;
    return next();
  });
}

module.exports = messageCount;
