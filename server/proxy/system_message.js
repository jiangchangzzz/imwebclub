var SystemMessage=require('../models').SystemMessage;

/**
 * 获取系统消息分页数据
 */
exports.getSystemMessagePage=function(pageSize,pageIndex,callback){
    var skipNum=(pageIndex-1)*pageSize;
    SystemMessage.find()
        .sort({create_at: -1})
        .skip(skipNum)
        .limit(15)
        .populate('owner_id')
        .exec(callback);
};

 /**
  * 获取系统消息数量
  */
exports.getSystemMessageCount=function(callback){
    SystemMessage.count()
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
    SystemMessage.remove({_id: id})
        .exec(callback);
}