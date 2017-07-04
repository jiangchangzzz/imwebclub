var Message = require('../proxy').Message;
var SystemMessage = require('../proxy').SystemMessage;
var eventproxy = require('eventproxy');
var config = require('../config');
var tools = require('../common/tools');

//获取用户消息页面
exports.index = function (req, res, next) {
  var user_id = req.session.user._id;
  var page = parseInt(req.query.page) || 1;
  page = page > 0 ? page : 1;
  var pageSize = config.list_message_count;

  var ep = new eventproxy();
  ep.fail(next);

  ep.all('has_read_messages', 'hasnot_read_messages', 'has_read_pages', function (has_read_messages, hasnot_read_messages, has_read_pages) {
    res.render('message/index', {
      has_read_messages: has_read_messages,
      hasnot_read_messages: hasnot_read_messages,
      current_page: page,
      pages: has_read_pages,
      base: '/message/me',
      _layoutFile: false
    });
  });

  ep.all('has_read', 'unread', function (has_read, unread) {
    [has_read, unread].forEach(function (msgs, idx) {
      var epfill = new eventproxy();
      epfill.fail(next);
      epfill.after('message_ready', msgs.length, function (docs) {
        docs = docs.filter(function (doc) {
          return !doc.is_invalid;
        });
        ep.emit(idx === 0 ? 'has_read_messages' : 'hasnot_read_messages', docs);
      });
      msgs.forEach(function (doc) {
        doc.friendly_create_at = tools.formatDate(doc.create_at, true);
        Message.getMessageRelations(doc, epfill.group('message_ready'));
      });
    });

    Message.updateMessagesToRead(user_id, unread);
  });

  Message.getUnreadMessageByUserId(user_id, ep.done('unread'));
  Message.getReadMessagePageByUserId(user_id, pageSize, page, ep.done('has_read'));

  Message.getReadMessageCountByUserId(user_id, ep.done('has_read_pages',function(count){
    return Math.ceil(count / pageSize);
  }));
};

//获取系统消息页面
exports.system = function (req, res, next) {
  var page = parseInt(req.query.page) || 1;
  page = page > 0 ? page : 1;
  var pageSize = config.list_system_message_count;

  var ep=new eventproxy();
  ep.all('messages','pages',function(messages,pages){
    res.render('message/system',{
      _layoutFile: false,
      messages: messages,
      pages: pages,
      current_page: page,
      base: '/message/system'
    });
  });

  SystemMessage.getSystemMessagePage(pageSize, page, ep.done('messages',function(messages){
    return messages.map(function(message){
      message.friendly_create_at = tools.formatDate(message.create_at, true);
      return message;
    });
  }));

  SystemMessage.getSystemMessageCount(ep.done('pages',function(count){
    return Math.ceil(count/pageSize);
  }));
};