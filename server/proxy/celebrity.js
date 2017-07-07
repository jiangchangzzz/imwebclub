var Celebrity=require('../models').Celebrity;

/**
 * 获取名人分页数据
 */
exports.getCelebrityPage=function(pageSize,pageIndex){
    var skipNum=(pageIndex-1)*pageSize;
    return Celebrity.find()
        .skip(skipNum)
        .limit(pageSize)
        .populate('userId')
        .exec();
};

/**
 * 添加名人数据
 */
exports.newAndSave=function(celebrity){
    var celebrity=new Celebrity(celebrity);
    return celebrity.save();
};

/**
 * 修改名人数据
 */
exports.updateCelebrity=function(celebrityId,celebrity){
    return Celebrity.findByIdAndUpdate(celebrityId,celebrity)
        .exec();
};

/**
 * 删除名人数据
 */
exports.removeCelebrity=function(celebrityId){
    return Celebrity.findByIdAndRemove(celebrityId)
        .exec();
};

/**
 * 获取名人数据的总数量
 */
exports.getCount=function(){
    return Celebrity.count().exec();
}