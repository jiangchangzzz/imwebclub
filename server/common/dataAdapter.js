/**
 * @file 数据适配
 * @author fishineyuan(382184760@qq.com)
 * @date 2015-01-30
 */
var _ = require('lodash');
var qrcode = require('yaqrcode');
var tools = require('./tools');
var render_helper = require('./render_helper');
var utility = require('utility');

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
    if(!reply){
      return null;
    }
    var out = {
        id: reply._id,
        answer: reply.answer || null,
        reply_id: reply.reply_id || reply.comment_id || null,
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
    if(!avatar && user.email){
      avatar = '//gravatar.com/avatar/' + utility.md5(user.email.toLowerCase()) + '?size=200';

      // www.gravatar.com 被墙
      //url = url.replace('//www.gravatar.com', '//gravatar.com');
      // 让协议自适应 protocol
      if (avatar.indexOf('http:') === 0) {
          avatar = avatar.slice(5);
      }

      //如果没有gravatar头像，则用默认
      if(avatar.indexOf("gravatar.com") >=0 && avatar.indexOf("d=retro") < 0){
          avatar += "&d=retro";
      }
      // 如果是 github 的头像，则限制大小
      if (avatar.indexOf('githubusercontent') !== -1) {
          avatar += '&s=120';
      }
    }

    if (avatar
        && avatar.indexOf("gravatar.com") >= 0
        && avatar.indexOf("d=retro") < 0
    ) {
        avatar += avatar.indexOf('?') === -1 ? "?d=retro" : '&d=retro';
    }
    return {
        id: user._id,
        name: user.name,
        loginname: user.loginname,
        url: user.url,
        avatar: avatar,
        score: user.score,
        company: user.company,
        team: user.team
    };
};

exports.outUserAll = function(user) {
    return {
        name: user.name,
        loginname: user.loginname,
        email: user.email,
        score: user.score,
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
        summary: item.summary,
        create_at: +item.create_at,
        friendly_create_at: tools.formatDate(item.create_at, true),
        update_at: +item.update_at,
        friendly_update_at: tools.formatDate(item.update_at, true),
        tab: item.tab,
        cover: item.cover,
        reply_count: item.reply_count,
        author: !item.author ? {} : exports.outUser(item.author),
    };
    if (options.content) {
        out.content = item.content;
        if (options.contentHTML) {
            out.content = render_helper.markdownRender(out.content || '');
        }
    }
    return out;
};

exports.outColumn = function(item){ 
    var out = {
        id: item._id.toString(),
        title: item.title,
        description: item.description,
        cover: item.cover,
        owner: item.owner,
        follower_count: item.follower_count,
        topic_count: item.topic_count,
        create_at: +item.create_at,
        is_follow: item.is_follow || false,
        friendly_create_at: tools.formatDate(item.create_at, true),
        update_at: +item.update_at,
        friendly_update_at: tools.formatDate(item.update_at, true),
    };
    return out;
}

//topic类型过滤器
exports.topicFormat = function (topics) {   
  var arr = [];
  for (var i = 0, len = topics.length; i < len; i++) {
    if (topics[i] && topics[i].type == 1) {
      var proArr = topics[i].title.replace("https://", "").replace("http://", "").split("/");
      if (proArr.length >= 3) {
        topics[i].proName = proArr[2];
        topics[i].proAuthor = proArr[1];
        arr.push(topics[i]);
      }
    } else {
      arr.push(topics[i]);
    }
  }
  return arr;
}

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

exports.outActivity = function(activity) {
  var out = {
    id: activity._id.toString(),
    author: !activity.author ? {} : exports.outUser(activity.author),
    friendly_create_at: tools.formatDate(activity.create_at, true),
    friendly_update_at: tools.formatDate(activity.update_at, true),
    title: activity.title,
    content: activity.content,
    begin_time: activity.begin_time,
    begin_str: activity.begin_str,
    end_time: activity.end_time,
    end_str: activity.end_str,
    location_str: activity.location_str,
    cover: activity.cover,
    pic: activity.pic,
    reply_count: activity.reply_count,
    visit_count: activity.visit_count,
    collect_count: activity.collect_count,
    ups: activity.ups
  }
  var now_time = (new Date()).getTime();
  if(now_time < activity.begin_time){
    out.status = '活动未开始';
    out.phase = 0;
  }else if(now_time > activity.end_time){
    out.status = '活动已结束';
    out.phase = 2;
  }else{
    out.status = '活动进行中';
    out.phase = 1;
  }
  return out;
}

exports.outQuestion = function(question){
  var out = {
    id: question._id.toString(),
    tab: question.tab,
    tabName: render_helper.tabName(question.tab),
    author: !question.author ? {} : exports.outUser(question.author),
    friendly_create_at: tools.formatDate(question.create_at, true),
    friendly_update_at: tools.formatDate(question.update_at, true),
    title: question.title,
    content: question.content,
    reply_count: question.reply_count,
    visit_count: question.visit_count,
    collect_count: question.collect_count,
    ups: question.ups,
    solved: question.solved,
    last_reply: question.last_reply,
    last_reply_at: question.last_reply_at,
    friendly_last_reply_at: tools.formatDate(question.last_reply_at, true),
    answer: question.answer,
    replies: question.replies,
    reply_up_threshold: question.reply_up_threshold
  };
  return out;
}
