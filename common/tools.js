var bcrypt = require('bcryptjs');
var moment = require('moment');
var render_helper = require('../common/render_helper');
var htmlToText = require('html-to-text');
moment.locale('zh-cn'); // 使用中文

// 格式化时间
exports.formatDate = function (date, friendly) {
  date = moment(date);

  if (friendly) {
    return date.fromNow();
  } else {
    return date.format('YYYY-MM-DD HH:mm');
  }

};

exports.validateId = function (str) {
  return (/^[a-zA-Z0-9\-_]+$/i).test(str);
};

exports.bhash = function (str, callback) {
  bcrypt.hash(str, 10, callback);
};

exports.bcompare = function (str, hash, callback) {
  bcrypt.compare(str, hash, callback);
};


/**
 * 文章概述
 * @param {String} markdownText 
 * @param {number} maxLen
 * @return {String} summary
 */
exports.genTopicSummary = function(markdownText, maxLen) {
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
