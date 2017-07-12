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
require('./banner');
require('./column');
require('./topic_column');
require('./system_message');
require('./celebrity');
require('./notebook');

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
exports.Banner          = mongoose.model('Banner');
exports.Column          = mongoose.model('Column');
exports.TopicColumn     = mongoose.model('TopicColumn');
exports.SystemMessage   = mongoose.model('SystemMessage');
exports.Celebrity       = mongoose.model('Celebrity');
exports.Notebook        = mongoose.model('Notebook');
