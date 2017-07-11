var Celebrity = require('../models').Celebrity;

/**
 * 获取名人分页数据
 */
exports.getCelebrityPage = function (pageSize, pageIndex) {
  var skipNum = (pageIndex - 1) * pageSize;
  return Celebrity.find()
    .skip(skipNum)
    .limit(pageSize)
    .populate('userId')
    .exec();
};

/**
 * 根据是否imweb成员筛选名人分页数据
 */
exports.getCelebrityPageByType=function(pageSize, pageIndex,isImweb){
    var skipNum = (pageIndex - 1) * pageSize;
    if(isImweb){
      return Celebrity.find({isImweb: true})
        .skip(skipNum)
        .limit(pageSize)
        .populate('userId')
        .exec();
    }
    else{
      return Celebrity.where('isImweb')
        .ne(true)
        .skip(skipNum)
        .limit(pageSize)
        .populate('userId')
        .exec();
    }
}

/**
 * 添加名人数据
 */
exports.newAndSave = function (celebrity) {
  var celebrity = new Celebrity(celebrity);
  return celebrity.save();
};

/**
 * 修改名人数据
 */
exports.updateCelebrity = function (celebrityId, celebrity) {
  return Celebrity.findByIdAndUpdate(celebrityId, celebrity)
    .exec();
};

/**
 * 删除名人数据
 */
exports.removeCelebrity = function (celebrityId) {
  return Celebrity.findByIdAndRemove(celebrityId)
    .exec();
};

/**
 * 获取名人数据的总数量
 */
exports.getCount = function () {
  return Celebrity.count()
    .exec();
}

/**
 * 获取是否为imweb成员数量
 */
exports.getCountByType=function(isImweb){
  if(isImweb){
    return Celebrity.count({isImweb: true})
        .exec();
  }
  else{
    return Celebrity.where('isImweb')
      .ne(true)
      .count()
      .exec();
  }
}
