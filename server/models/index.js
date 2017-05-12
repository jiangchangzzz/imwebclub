var mongoose = require('mongoose');
var config   = require('../config');
var logger = require('../common/logger')

mongoose.connect(config.db, {
  server: {poolSize: 20}
}, function (err) {
  if (err) {
    logger.error('connect to %s error: ', config.db, err.message);
    process.exit(1);
  }
});

// models
require('./user');
require('./topic');
require('./reply');
require('./topic_collect');
require('./user_collect');
require('./user_follow');
require('./message');
require('./marktang');
require('./draft');
require('./question');
require('./activity');
require('./question_answer');

exports.User            = mongoose.model('User');
exports.Topic           = mongoose.model('Topic');
exports.Reply           = mongoose.model('Reply');
exports.TopicCollect    = mongoose.model('TopicCollect');
exports.UserCollect     = mongoose.model('UserCollect');
exports.UserFollow      = mongoose.model('UserFollow');
exports.Message         = mongoose.model('Message');
exports.Marktang        = mongoose.model('Marktang');
exports.Draft           = mongoose.model('Draft');
exports.Question        = mongoose.model('Question');
exports.Activity        = mongoose.model('Activity');
exports.QuestionAnswer  = mongoose.model('QuestionAnswer');
