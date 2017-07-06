var config = require('../config');
var Promise=require('bluebird');
var UserFollow=require('../proxy').UserFollow;
var Celebrity = require('../proxy').Celebrity;

/**
 * 获取名人堂列表页面
 */
exports.list = function (req, res, next) {
  var page = parseInt(req.query.page) || 1;
  var page = page > 0 ? page : 1;
  var pageSize = config.list_celebrity_count;

  Promise.all([
      Celebrity.getCelebrityPage(pageSize,page),
      Celebrity.getCount()
    ]).spread(function (celebrities, count) {
      var pages = Math.ceil(count / pageSize);
      console.log(celebrities);
      res.render('celebrity/list', {
        _layoutFile: false,
        celebrities: celebrities,
        pages: pages,
        current_page: page,
        base: '/celebrity/list'
      });
    })
    .catch(next);
};
