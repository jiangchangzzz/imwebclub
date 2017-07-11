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
      getCelebrities(pageSize, page, false), 
      Celebrity.getCountByType(false)
    ]).spread(function (celebrities, count) {
      var pages = Math.ceil(count / pageSize);
      console.log(celebrities);
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

exports.imweb = function (req, res, next) {
  var page = parseInt(req.query.page) || 1;
  var page = page > 0 ? page : 1;
  var pageSize = config.list_celebrity_count;
  var userId=req.session.user?req.session.user._id:null;

  Promise.all([
      getCelebrities(pageSize, page, true), 
      Celebrity.getCountByType(true)
    ]).spread(function (celebrities, count) {
      var pages = Math.ceil(count / pageSize);
      res.render('celebrity/list', {
        _layoutFile: false,
        celebrities: celebrities,
        pages: pages,
        current_page: page,
        base: '/celebrity/imweb',
        active: 'celebrity'
      });
    })
    .catch(next);
};

/**
 * 分页获取名人数据，文章数目
 */
function getCelebrities(pageSize, page, isImweb) {
  //获取名人分页数据
  return Celebrity.getCelebrityPageByType(pageSize, page, isImweb)
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
