/**
 * @file 数据适配
 * @author fishineyuan(382184760@qq.com)
 * @date 2015-01-30
 */
var _ = require('lodash');
var qrcode = require('yaqrcode');
var tools = require('./tools');
var render_helper = require('./render_helper');

/**
 * 将二级评论附件到一级评论上
 * @param {Array.<Object>} replies
 * @return {Array.<Object>}
 */
exports.appendSubRepliesToReplies = function(replies) {
    var mainReplies = {};
    _.each(replies, function(item) {
        if (!item.reply_id) {
            mainReplies[item._id] = item;
        }
    });
    _.each(replies, function(item) {
        if (item.reply_id && mainReplies[item.reply_id]) {
            var mainReply = mainReplies[item.reply_id];
            mainReply.subReplies = mainReply.subReplies || [];
            mainReply.subReplies.push(item);
        }
    });
    return _.map(mainReplies, function(item, id) {
        return item;
    });
};

exports.outReplies = function(replies) {
    return _.map(replies, function(item) {
        return exports.outReply(item);
    });
};

exports.outReply = function(reply) {
    var out = {
        id: reply._id,
        reply_id: reply.reply_id || null,
        content: reply.content,
        text: reply.text || '',
        create_at: +reply.create_at,
        friendly_create_at: tools.formatDate(reply.create_at, true),
        update_at: +reply.update_at,
        friendly_update_at: tools.formatDate(reply.update_at, true),
        ups: reply.ups,
        content_is_html: reply.content_is_html,
        author: !reply.author ? {} : exports.outUser(reply.author),
        subReplies: _.map(reply.subReplies || [], function(item) {
            return exports.outReply(item);
        })
    };
    return out;
};

exports.outUser = function(user) {
    //如果没有gravatar头像，则用默认
    var avatar = user.avatar;
    if (avatar
        && avatar.indexOf("gravatar.com") >= 0
        && avatar.indexOf("d=retro") < 0
    ) {
        avatar += "&d=retro";
    }
    return {
        id: user._id,
        name: user.name,
        loginname: user.loginname,
        url: user.url,
        avatar: avatar,
        company: user.company,
        team: user.team
    };
};

exports.outUserAll = function(user) {
    return {
        name: user.name,
        loginname: user.loginname,
        email: user.email,
        url: user.url,
        location: user.location,
        signature: user.signature,
        weibo: user.weibo,
        accessToken: user.accessToken,
        accessTokenBase64: qrcode(user.accessToken),
        avatar: user.avatar
    };
};

exports.outTopic = function(item, options) {
    options = options || {};
    var out = {
        id: item._id.toString(),
        title: item.title,
        create_at: +item.create_at,
        friendly_create_at: tools.formatDate(item.create_at, true),
        update_at: +item.update_at,
        friendly_update_at: tools.formatDate(item.update_at, true),
        tab: item.tab,
        reply_count: item.reply_count
    };
    if (options.content) {
        out.content = item.content;
        if (options.contentHTML) {
            out.content = render_helper.markdownRender(out.content || '');
        }
    }
    return out;
};

exports.outDraft = function(item, options) {
    options = options || {};
    var out = {
        id: item._id.toString(),
        topic_id: item.topic_id,
        tab: item.tab,
        title: item.title,
        create_at: +item.create_at,
        friendly_create_at: tools.formatDate(item.create_at, true),
        update_at: +item.update_at,
        friendly_update_at: tools.formatDate(item.update_at, true)
    };
    if (options.content) {
        out.content = item.content;
    }
    return out;
};
