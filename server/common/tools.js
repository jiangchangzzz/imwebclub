'use strict';
var _ = require('lodash');
var passwordHash = require('password-hash');
var moment = require('moment');
var EventProxy = require('eventproxy');
var cheerio = require('cheerio');
var htmlToText = require('html-to-text');
var render_helper = require('../common/render_helper');
moment.locale('zh-cn'); // 使用中文

// 格式化时间
exports.formatDate = function (date, friendly) {
  date = moment(date);

  if (friendly) {
    var now=moment();
    if(now.diff(date,'months')>0){
        return date.format('YYYY-MM-DD HH:mm');
    }
    else{
        return date.fromNow();
    }
  } else {
    return date.format('YYYY-MM-DD HH:mm');
  }

};

exports.validateId = function (str) {
  return (/^[a-zA-Z0-9\-_]+$/i).test(str);
};

exports.bhash = function (str, callback) {
  //bcrypt.hash(str, 10, callback);
  callback(null, passwordHash.generate(str));
};

exports.bcompare = function (str, hash, callback) {
    var result = passwordHash.verify(str, hash);
    callback(null, result);
  //bcrypt.compare(str, hash, callback);
};

/**
 * 通过model的id判断两个model是否相同
 */
exports.modelEqual = function (modelA, modelB) {
    return exports.idEqual(modelA._id, modelB._id);
};

/**
 * 判断model的id是否相同
 */
exports.idEqual = function(idA, idB) {
    if (!idA && !idB) {
        return true;
    } else if (!idA || !idB) {
        return false;
    } else {
        return idA.toString() === idB.toString();
    }
};

/**
 * 文章概述
 * @param {String} markdownText
 * @param {number} maxLen
 * @return {String} summary
 */
exports.genSummaryFromContent = function(markdownText, maxLen) {
    var html = render_helper.markdownRender(markdownText || '');
    var text = htmlToText.fromString(html);
    var lines = text.split(/[\r\n]+/);
    var summary = '';
    for (var i in lines) {
        var line = lines[i];
        line = line.replace(/\s+$/, '');
        if (!line.trim()) {
            continue;
        }
        if (summary.length + line.length <= maxLen) {
            summary = summary + (summary ? '\n' : '') + line;
        } else {
            break;
        };
    }
    return summary;
};

/**
 * 文章图片
 * @param {String} markdownText
 * @return {Array} imgArr
 */
exports.genPicFromContent = function(markdownText){
    var html = render_helper.markdownRender(markdownText || '');
    var imgArr = [];
    // 不用cheerio 用正则匹配图片
    var regImgArr = html.match(/<img.*?(?:>|\/>)/gi);
    if(regImgArr && regImgArr.length >0 ){
        regImgArr.forEach(function(img) {
            imgArr.push(img.match(/src=[\'\"]?([^\'\"]*)[\'\"]?/i)[1]);
        })
    }

    // var $ = cheerio.load(html);
    // var $img = $("img");
    // var imgArr = [];
    // for (var i=0,len=$img.length;i<len;i++){
    //     imgArr.push($img[i].attribs.src);
    // }
    return imgArr;
}
/**
 * 提取回复的文本
 * @param {String} markdownText
 * @return {String} text
 */
exports.genReplyText = function(markdownText) {
    var html = render_helper.markdownRender(markdownText || '');
    var text = htmlToText.fromString(html);
    return text.replace(/\s+([\r\n]|$)/g, '\n')
        .replace(/(^|[\r\n])\s+/g, '\n')
        .replace(/[\r\n]{2,}/g, '\n');
};

/**
 * 创建一个json 处理的eventproxy
 * @param {Object} res
 * @param {function} next
 * @return {EventProxy}
 */
exports.createJsonEventProxy = function(res, next) {
    var ep = EventProxy.create();
    ep.fail(next);
    ep.on('fail', function(ret, msg) {
        ep.unbind();
        res.send({ret: ret || 400, msg: msg || ''});
    });
    ep.on('done', function(data) {
        ep.unbind();
        res.send(_.extend({ ret: 0 }, data || {}));
    });
    return ep;
};
