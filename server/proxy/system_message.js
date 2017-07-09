var Promise = require('bluebird');
var SystemMessage = require('../models').SystemMessage;
var User = require('./user');

/**
 * 获取系统消息数量
 */
exports.getSystemMessageCount = function () {
  return SystemMessage.count()
    .exec();
};

/**
 * 获取系统消息分页数据
 */
exports.getSystemMessagePage = function (pageSize, pageIndex) {
  var skipNum = (pageIndex - 1) * pageSize;
  return SystemMessage.find()
    .sort({
      create_at: -1
    })
    .skip(skipNum)
    .limit(pageSize)
    .populate('owner_id')
    .exec();
}

/**
 * 创建新的系统消息
 */
exports.newAndSave = function (systemMessage) {
  var systemMessage = new SystemMessage(systemMessage);
  return systemMessage.save();
}

/**
 * 删除系统消息
 */
exports.removeSystemMessage = function (id) {
  return SystemMessage.findByIdAndRemove(id)
    .exec();
}

/**
 * 根据用户最后访问系统消息的时间获取已读系统消息
 */
exports.getReadSystemMessageByTime = function (time) {
  return SystemMessage.find()
    .where('create_at')
    .lte(time)
    .sort({
      create_at: -1
    })
    .exec();
}

/**
 * 根据用户最后访问系统消息的时间获取新系统消息
 */
exports.getNoReadSystemMessageByTime = function (time) {
  return SystemMessage.find()
    .where('create_at')
    .gt(time)
    .sort({
      create_at: -1
    })
    .exec();
}

/**
 *  根据用户id获取未读系统消息数目
 */
exports.getNoReadSystemMessageByUserId = function (userId) {
  var getUserById = Promise.promisify(User.getUserById);

  return getUserById(userId)
    .then(function (user) {
      if (!user) {
        return 0;
      }

      var time = user.last_message_time;
      return SystemMessage.where('create_at')
        .gt(time)
        .count()
        .exec();
    });
};
