var BannerProxy = require('../proxy').Banner;

/**
 * 获取服务器banner列表
 */
exports.getBanners = function(req, res, next) {
  if ( /^\/public\//.test(req.path) ) {
    return next();
  }

  BannerProxy.activeBannersSortedByIndex(function(banners) {
    res.locals.global_banners = banners;
    return next();
  });

};

