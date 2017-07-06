var Celebrity=require('../models').Celebrity;
var UserFollow=require('../proxy').UserFollow;
var Topic=require('../proxy').Topic;
var Promise=require('bluebird');

/**
 * 获取名人分页数据
 */
exports.getCelebrityPage=function(pageSize,pageIndex){
    var getObjectFollowCount=Promise.promisify(UserFollow.getObjectFollowCount);

    var skipNum=(pageIndex-1)*pageSize;
    return Celebrity.find()
        .skip(skipNum)
        .limit(pageSize)
        .populate('userId')
        .exec()
        .then(function(celebrities){
            var promises=celebrities.map(function(celebrity){
                if(celebrity.userId){
                    var id=celebrity.userId._id;
                    return Promise.all([
                        getObjectFollowCount(id),
                        Topic.getTopicCount(id)
                    ]).spread(function(follower_count,topic_count){
                        celebrity.userId.follower_count=follower_count;
                        celebrity.userId.topic_count=topic_count;
                        return celebrity;
                    })
                }
                else{
                    return celebrity;
                }
            });
            return Promise.all(promises);
        });
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