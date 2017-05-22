var models = require('../models');
var Banner = models.Banner;
var EventProxy = require('eventproxy');

/**
 * 保存一个banner
 * @param {String} link 图片链接
 * @param {String} background 背景颜色，填补两边空白
 */

exports.newAndSave = function (param, callback) {
  var banner = new Banner();
  banner.image = param.image;
  banner.link = param.link;
  banner.background = param.background;
  banner.index = param.index;
  banner.status = param.status;
  banner.save(callback);
};

exports.bannerList = function(callback) {
  Banner.find({}).sort({status: -1 ,index: -1}).exec(function (err, result) {
    if (!err) {
      callback(result);
    }
  });
};

exports.activeBannersSortedByIndex = function(callback) {
  Banner.find({status: 1}).sort({index: -1}).exec(function(err, result) {
    if (!err) {
      callback(null, result);
    }
  });
};

exports.getBannerById = function(id, callback) {
  Banner.findOne({_id: id}, function(err, banner) {
    if (err) {
      return callback(err);
    }
    if (!banner) {
      return callback(err, null);
    }
    return callback(banner);
  });
};
