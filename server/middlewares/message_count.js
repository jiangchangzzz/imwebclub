var eventProxy = require('eventproxy');

var Message = require('../proxy').Message;
var SystemMessage = require('../proxy').SystemMessage;

//获取总消息数量中间件
function messageCount(req, res, next) {
  if (!req.session.user) {
    return next();
  }

  var ep = new eventProxy();
  ep.all('messageCount', 'systemCount', function (messageCount, systemCount) {
    res.locals.messageCount = messageCount;
    res.locals.systemCount = systemCount;
    return next();
  });

  var userId = req.session.user._id;
  Message.getMessagesCount(userId, ep.done('messageCount'));
  SystemMessage.getNoReadSystemMessageByUserId(userId, ep.done('systemCount'));
}

module.exports = messageCount;
