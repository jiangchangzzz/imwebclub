var TopicColumn = require('../models').TopicColumn;
var _ = require('lodash')

exports.getTopicColumn = function (columnId, topicId, callback) {
  TopicColumn.findOne({column_id: columnId, topic_id: topicId}, callback);
};

exports.getTopicColumnsBycolumnId = function (columnId, opt, callback) {
  var defaultOpt = {sort: '-create_at'};
  opt = _.assign(defaultOpt, opt)
  TopicColumn.find({column_id: columnId}, '', opt, callback);
};

exports.newAndSave = function (columnId, topicId, callback) {
  var topic_column = new TopicColumn();
  topic_column.column_id = columnId;
  topic_column.topic_id = topicId;
  topic_column.save(callback);
};

exports.remove = function (columnId, topicId, callback) {
  TopicColumn.remove({column_id: columnId, topic_id: topicId}, callback);
};

exports.removeByColumnId = function (columnId, callback) {
  TopicColumn.remove({column_id: columnId}, callback);
};

/**
 * 获取某文章被添加到专栏的次数
 */
exports.getTopicColumnCount = function (topicId, callback) {
    TopicColumn.count({topic_id: topicId}, callback);
};

/**
 * 获取某专栏包含文章的数目
 */
exports.getColumnTopicCount = function (columnId, callback) {
    TopicColumn.count({column_id: columnId}, callback);
};