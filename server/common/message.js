var models       = require('../models');
var eventproxy   = require('eventproxy');
var Message      = models.Message;
var User         = require('../proxy').User;
var messageProxy = require('../proxy/message');
var _            = require('lodash');

exports.sendReplyMessage = function (master_id, author_id, topic_id, reply_id, callback) {
  callback = callback || _.noop;
  var ep = new eventproxy();
  ep.fail(callback);

  var message       = new Message();
  message.type      = 'reply';
  message.master_id = master_id;
  message.author_id = author_id;
  message.topic_id  = topic_id;
  message.reply_id  = reply_id;

  message.save(ep.done('message_saved'));
  ep.all('message_saved', function (msg) {
    callback(null, msg);
  });
};

exports.sendAtMessage = function (master_id, author_id, topic_id, reply_id, callback) {
  callback = callback || _.noop;
  var ep = new eventproxy();
  ep.fail(callback);

  var message       = new Message();
  message.type      = 'at';
  message.master_id = master_id;
  message.author_id = author_id;
  message.topic_id  = topic_id;
  message.reply_id  = reply_id;

  message.save(ep.done('message_saved'));
  ep.all('message_saved', function (msg) {
    callback(null, msg);
  });
};

//批量发送专栏更新消息
exports.sendColumnMessage=function(master_ids, column_id, callback){
  callback = callback || _.noop;
  var ep = new eventproxy();
  ep.fail(callback);

  var message       = new Message();
  message.type      = 'column';
  message.column_id  = column_id;

  master_ids.forEach(function(master_id){
    message.master_id=master_id;
    message.save(ep.done('message_saved'));
  });
  
  ep.after('message_saved',master_ids.length,function (msg) {
    callback(null, msg);
  });
};

exports.sendQuestionMessage=function(master_id, author_id, question_id, callback){
  callback = callback || _.noop;
  var ep = new eventproxy();
  ep.fail(callback);

  var message       = new Message();
  message.type      = 'question';
  message.master_id = master_id;
  message.author_id = author_id;
  message.question_id  = question_id;

  message.save(ep.done('message_saved'));
  ep.all('message_saved', function (msg) {
    callback(null, msg);
  });
}


