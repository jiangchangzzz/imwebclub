var models  = require('../models');
var User    = models.User;
var utility = require('utility');
var uuid    = require('node-uuid');
var EventProxy   = require('eventproxy');
var _       = require('lodash');
/**
 * 根据用户名列表查找用户列表
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} names 用户名列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByNames = function (names, callback) {
  if (names.length === 0) {
    return callback(null, []);
  }
  User.find({ loginname: { $in: names } }, callback);
};

/**
 * 根据登录名查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} loginName 登录名
 * @param {Function} callback 回调函数
 */
exports.getUserByLoginName = function (loginName, callback) {
  User.findOne({'loginname': new RegExp('^'+loginName+'$', "i")}, callback);
};

/**
 * 根据用户ID，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} id 用户ID
 * @param {Function} callback 回调函数
 */
exports.getUserById = function (id, callback) {
  if (!id) {
    return callback();
  }
  User.findOne({_id: id}, callback);
};

/**
 * 根据邮箱，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} email 邮箱地址
 * @param {Function} callback 回调函数
 */
exports.getUserByMail = function (email, callback) {
  User.findOne({email: email}, callback);
};

/**
 * 根据用户ID列表，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} ids 用户ID列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByIds = function (ids, callback) {
  User.find({'_id': {'$in': ids}}, callback);
};

/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} opt 选项
 * @param {Function} callback 回调函数
 */
exports.getUsersByQuery = function (query, opt, callback) {
  User.find(query, '', opt, callback);
};

/**
 * 根据查询条件，获取一个用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} name 用户名
 * @param {String} key 激活码
 * @param {Function} callback 回调函数
 */
exports.getUserByNameAndKey = function (loginname, key, callback) {
  User.findOne({loginname: loginname, retrieve_key: key}, callback);
};

exports.newAndSave = function (name, loginname, pass, email, comp, comp_mail, avatar_url, active, callback) {
  var user = new User();
  user.name = loginname;
  user.loginname = loginname;
  user.pass = pass;
  user.email = email;
  user.company = comp;
  user.comp_mail = comp_mail;
  user.avatar = avatar_url;
  user.active = active || false;
  user.accessToken = uuid.v4();

  user.save(callback);
};

/**
 * 保存用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {Object} userInfo 用户信息
 * @param {function(Object, Object)} callback 回调
 */
exports.newAndSaveWithAll = function (userInfo, callback) {
  var user = new User();
  user.name = userInfo.name || userInfo.loginname;
  user.loginname = userInfo.loginname;
  user.pass = userInfo.pass;
  user.email = userInfo.email;
  user.company = userInfo.company; 
  user.team = userInfo.team; 
  user.avatar = userInfo.avatar_url;
  user.active = userInfo.active || false; 
  user.accessToken = uuid.v4();
  user.save(function(err) {
    callback(err, user);
  });
};

var makeGravatar = function (email) {
  return 'http://gravatar.com/avatar/' + utility.md5(email.toLowerCase()) + '?size=48';
};
exports.makeGravatar = makeGravatar;

exports.getGravatar = function (user) {
  return user.avatar || makeGravatar(user);
};

exports.getTeamMember = function (company, team, callback) {
    User.find({company: company, team: team}, callback);
};

exports.getFollowUser = function(followUser=[], callback) {
  var ep = new EventProxy();
  ep.after('follow', followUser.length, function(users) {
    callback(null, users);
  });
  ep.fail(callback);

  _.forEach(followUser, id => {
    User.findOne({_id: id}, ep.done(function(user) {
      if (!user) {
        return res.render404('这个用户不存在。');
      }
      ep.emit('follow', {
        id,
        loginname: user.loginname,
        score: user.score,
        avatar_url: user.avatar_url,
      }) 
    }));
  })
}

exports.listOrderByTeam = function(start, limit, callback) {
    start = start || 0;
    limit = limit || 0xfffffff;
    return User.find()
        .sort({ company: 1, team: 1 })
        .skip(start)
        .limit(limit)
        .exec(callback);
};
