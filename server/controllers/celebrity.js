var config = require('../config');
var Promise = require('bluebird');
var Celebrity = require('../proxy').Celebrity;
var Topic=require('../proxy').Topic;

/**
 * 获取名人堂列表页面
 */
exports.list = function (req, res, next) {
  var page = parseInt(req.query.page) || 1;
  var page = page > 0 ? page : 1;
  var pageSize = config.list_celebrity_count;
  var userId=req.session.user?req.session.user._id:null;

  Promise.all([
      getCelebrities(pageSize, page), 
      Celebrity.getCount()
    ]).spread(function (celebrities, count) {
      var pages = Math.ceil(count / pageSize);
      res.render('celebrity/list', {
        _layoutFile: false,
        celebrities: celebrities,
        pages: pages,
        current_page: page,
        base: '/celebrity/list',
        active: 'celebrity'
      });
    })
    .catch(next);
};

/**
 * 分页获取名人数据，文章数目
 */
function getCelebrities(pageSize, page) {
  //获取名人分页数据
  return Celebrity.getCelebrityPage(pageSize, page)
    .then(function (celebrities) {

      //若关联用户存在，则获取其文章数目
      return Promise.map(celebrities, function (celebrity) {
        if (celebrity.userId) {
          var id = celebrity.userId._id;
          return Topic.getTopicCount(id)
            .then(function(topic_count){
              celebrity.userId.topic_count = topic_count;
              return celebrity;
            });
        } else {
          return celebrity;
        }
      });
    });
}
