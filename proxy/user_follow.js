var UserFollow = require('../models').UserFollow;
var _ = require('lodash');

exports.getUserFollow = function (userId, objectId, callback) {
  UserFollow.findOne({user_id: userId, object_id: objectId}, callback);
};

exports.getUserFollowsByUserId = function (userId, kind, opt, callback) {
  var defaultOpt = {sort: '-create_at'};
  opt = _.assign(defaultOpt, opt)
  if(kind && kind !== 'all'){
    UserFollow.count({user_id: userId, kind: kind}, '', opt, callback);
  }else{
    UserFollow.find({user_id: userId}, '', opt, callback);
  }
};

exports.newAndSave = function (userId, objectId, kind, callback) {
  var user_collect      = new UserFollow();
  user_collect.user_id  = userId;
  user_collect.object_id = objectId;
  user_collect.kind = kind;
  user_collect.save(callback);
};

exports.remove = function (userId, objectId, callback) {
  UserFollow.remove({user_id: userId, object_id: objectId}, callback);
};

/**
 * 获取目标被关注的数目
 */
exports.getObjectFollowCount = function (objectId, callback) {
    UserFollow.count({object_id: objectId}, callback);
};

/**
 * 获取用户关注某类型数目
 */
exports.getUserFollowCount = function (userId, kind, callback) {
    if(kind && kind !== 'all'){
      UserFollow.count({user_id: userId, kind: kind}, callback);
    }else{
      UserFollow.count({user_id: userId}, callback);
    }
};
