'use strict';
var EventProxy = require('eventproxy');
var models = require('../models');
var Column = models.Column;
var User = require('./user');
var tools = require('../common/tools');
var at = require('../common/at');
var _ = require('lodash');
var config = require('../config');
var tools = require('../common/tools');
var dataAdapter = require('../common/dataAdapter');

exports.getColumnById = function (id, callback) {
  Column.findOne({
    _id: id,
    deleted: false
  }, function (err, column) {
    return callback(err, column);
  });
};

exports.getCountByQuery = function (query, callback) {
  Column.count(query, callback);
};

exports.getColumnsByQuery = function (query, opt, callback) {
  query.deleted = false;
  Column.find(query, {}, opt, function (err, columns) {
    if (err) {
      return callback(err);
    }
    if (columns.length === 0) {
      return callback(null, []);
    }
    var proxy = new EventProxy();
    proxy.after('column_ready', columns.length, function (columns) {
      return callback(null, columns);
    });

    columns.forEach(function (column, i) {
      User.getUserById(column.owner_id, function (err, owner) {
        column.owner = dataAdapter.outUser(owner || {});
        proxy.emit('column_ready', column);
      });
    });
  });
};

exports.getFullColumn = function (id, callback) {

};

exports.newAndSave = function (title, description, cover, ownerId, callback) {
  var column = new Column();
  column.title = title;
  column.description = description;
  column.cover = cover;
  column.owner_id = ownerId;
  column.save(callback);
};

exports.queryAuthorActivity = function (ownerId, callback) {
  Column.find({
      owner_id: ownerId
    }).sort('-create_at')
    .exec(callback);
};
