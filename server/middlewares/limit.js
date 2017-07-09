'use strict';
var config = require('../config');
var cache  = require('../common/cache');
var moment = require('moment');

var SEPARATOR = '^_^@T_T';

// 发帖时间间隔，为毫秒
var POST_INTERVAL = config.post_interval;
if (!(POST_INTERVAL > 0)) POST_INTERVAL = 0;
var DISABLE_POST_INTERVAL = POST_INTERVAL > 0 ? false : true;


var makePerDayLimiter = function (identityName, identityFn) {
  return function (name, limitCount, options) {
    /*
    options.showJson = true 表示调用来自API并返回结构化数据；否则表示调用来自前段并渲染错误页面
    */
    return function (req, res, next) {
      var identity = identityFn(req);
      var YYYYMMDD = moment().format('YYYYMMDD');
      var key      = YYYYMMDD + SEPARATOR + identityName + SEPARATOR + name + SEPARATOR + identity;

      cache.get(key, function (err, count) {
        if (err) {
          return next(err);
        }
        count = count || 0;
        if (count < limitCount) {
          count += 1;
          cache.set(key, count, 60 * 60 * 24);
          res.set('X-RateLimit-Limit', limitCount);
          res.set('X-RateLimit-Remaining', limitCount - count);
          next();
        } else {
          res.status(403);
          if (options.showJson) {
            res.send({success: false, error_msg: '频率限制：当前操作每天可以进行 ' + limitCount + ' 次'});
          } else {
            res.render('notify/notify', { error: '频率限制：当前操作每天可以进行 ' + limitCount + ' 次'});
          }
        }
      });
    };
  };
};

exports.peruserperday = makePerDayLimiter('peruserperday', function (req) {
  return (req.user || req.session.user).loginname;
});

exports.peripperday = makePerDayLimiter('peripperday', function (req) {
  var realIP = req.get('x-real-ip');
  if (process.env.NODE_ENV !== 'test' && !realIP) {
    throw new Error('should provice `x-real-ip` header')
  }
  return realIP;
});

/**
 * 发帖/评论时间间隔限制
 */
exports.postInterval = function (req, res, next) {
  if (DISABLE_POST_INTERVAL) return next();
  if (isNaN(req.session.lastPostTimestamp)) {
    req.session.lastPostTimestamp = Date.now();
    return next();
  }
  if (Date.now() - req.session.lastPostTimestamp < POST_INTERVAL) {
    var ERROR_MSG = '您的回复速度太快。';
    res.render('notify/notify', {error: ERROR_MSG});
    return;
  }

  req.session.lastPostTimestamp = Date.now();
  next();
};
