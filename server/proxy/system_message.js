var SystemMessage=require('../models').SystemMessage;
var User=require('./user');

 /**
  * 获取系统消息数量
  */
exports.getSystemMessageCount=function(callback){
    SystemMessage.count()
        .exec(callback);
};

/**
 * 获取系统消息分页数据
 */
exports.getSystemMessagePage=function(pageSize,pageIndex,callback){
    var skipNum=(pageIndex-1)*pageSize;
    SystemMessage.find()
        .sort({create_at: -1})
        .skip(skipNum)
        .limit(pageSize)
        .populate('owner_id')
        .exec(callback);
};

/**
 * 创建新的系统消息
 */
exports.newAndSave=function(title,content,owner_id,callback){
    var systemMessage=new SystemMessage();
    systemMessage.title=title;
    systemMessage.content=content;
    systemMessage.owner_id=owner_id;
    systemMessage.save(callback);
}

/**
 * 删除系统消息
 */
exports.removeSystemMessage=function(id,callback){
    SystemMessage.findByIdAndRemove(id,callback);
}

/**
 * 根据用户最后访问系统消息的时间获取已读系统消息
 */
exports.getReadSystemMessageByTime=function(time,callback){
    SystemMessage.find()
        .where('create_at')
        .lte(time)
        .sort({create_at: -1})
        .exec(callback);
}

/**
 * 根据用户最后访问系统消息的时间获取新系统消息
 */
exports.getNoReadSystemMessageByTime=function(time,callback){
    SystemMessage.find()
        .where('create_at')
        .gt(time)
        .sort({create_at: -1})
        .exec(callback);
}

/**
 *  根据用户id获取未读系统消息数目
 */
exports.getNoReadSystemMessageByUserId=function(userId,callback){
    User.getUserById(userId,function(err,user){
        if(err){
            return callback(err);
        }

        if(!user){
            return callback(null,0);
        }

        var time=user.last_message_time;
        SystemMessage.where('create_at')
            .gt(time)
            .count()
            .exec(callback);
    });
};

