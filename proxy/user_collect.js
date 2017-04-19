var UserCollect = require('../models').UserCollect;
var _ = require('lodash');

exports.getUserCollect = function (userId, objectId, callback) {
  UserCollect.findOne({user_id: userId, object_id: objectId}, callback);
};

exports.getUserCollectsByUserId = function (userId, kind, opt, callback) {
  var defaultOpt = {sort: '-create_at'};
  opt = _.assign(defaultOpt, opt)
  if(kind && kind !== 'all'){
    UserCollect.count({user_id: userId, kind: kind}, '', opt, callback);
  }else{
    UserCollect.find({user_id: userId}, '', opt, callback);
  }
};

exports.newAndSave = function (userId, objectId, kind, callback) {
  var user_collect      = new UserCollect();
  user_collect.user_id  = userId;
  user_collect.object_id = objectId;
  user_collect.kind = kind;
  user_collect.save(callback);
};

exports.remove = function (userId, objectId, callback) {
  UserCollect.remove({user_id: userId, object_id: objectId}, callback);
};

/**
 * 获取目标被收藏的数目
 */
exports.getObjectCollectCount = function (objectId, callback) {
    UserCollect.count({object_id: objectId}, callback);
};

/**
 * 获取用户收藏某类型数目
 */
exports.getUserCollectCount = function (userId, kind, callback) {
    if(kind && kind !== 'all'){
      UserCollect.count({user_id: userId, kind: kind}, callback);
    }else{
      UserCollect.count({user_id: userId}, callback);
    }
};
