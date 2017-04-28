var validator = require('validator');
var at = require('../common/at');
var User = require('../proxy').User;
var Activity = require('../proxy').Activity;
var UserCollect = require('../proxy').UserCollect;
var UserFollow = require('../proxy').UserFollow;
var EventProxy = require('eventproxy');
var tools = require('../common/tools');
var store = require('../common/store');
var config = require('../config');
var _ = require('lodash');
var cache = require('../common/cache');
var logger = require('../common/logger');
var escapeHtml = require('escape-html');
var mail = require('../common/mail');
var dataAdapter = require('../common/dataAdapter');
var renderHelper = require('../common/render_helper');

const activityMock = [{
  title: 'ArchSummit 深圳 2017'
},{
  title: 'GMTC 全球移动技术大会'
},{
  title: '世界云计算日'
},{
  title: '中国创客联赛南京站2017创客马拉松'
}];

function saveActivity(req, next, callback) {
  var title = escapeHtml(validator.trim(req.body.title));
  var tab = validator.escape(validator.trim(req.body.tab));
  var content = validator.trim(req.body.content || req.body.t_content);
  var begin_time = req.body.begin_time;
  var begin_str = req.body.begin_str;
  var end_time = req.body.end_time;
  var end_str = req.body.end_str;
  var location_str = req.body.location_str;

  var user = req.session.user;
  var ep = new EventProxy();
  ep.fail(next);

  // console.log(title+"is done !");

  Activity.newAndSave(title, tab, content, begin_time, begin_str, end_time, end_str, location_str, user._id, ep.done('activity'));

  ep.all('activity', function (activity, user) {
    callback(null, activity);
  });
};

exports.index = function (req, res, next) {
  var activity_id = req.params.tid;
  var currentUser = req.session.user;

  if (activity_id.length !== 24) {
    return res.render404('此话题不存在或已被删除。');
  }
  var events = ['activity', 'is_collect', 'is_follow'];
  var ep = EventProxy.create(events,
    function (activity, is_collect, is_follow) {
      res.render('activity/index', {
        active: 'activity',
        activity: dataAdapter.outActivity(activity),
        is_uped: currentUser && activity.ups.indexOf(currentUser.id) > -1,
        is_collect: is_collect,
        is_follow: is_follow
      });
  });

  ep.fail(next);

  Activity.getFullActivity(activity_id, ep.done(function (message, activity, author) {
    if (message) {
      logger.error('getFullActivity error activity_id: ' + activity_id)
      return res.renderError(message);
    }

    activity.visit_count += 1;
    activity.save();

    activity.author  = author;
    /*activity.replies = replies;

    // 点赞数排名第三的回答，它的点赞数就是阈值
    activity.reply_up_threshold = (function () {
      var allUpCount = replies.map(function (reply) {
        return reply.ups && reply.ups.length || 0;
      });
      allUpCount = _.sortBy(allUpCount, Number).reverse();

      var threshold = allUpCount[2] || 0;
      if (threshold < 3) {
        threshold = 3;
      }
      return threshold;
    })();*/

    ep.emit('activity', activity);
  }));

  if (!currentUser) {
    ep.emit('is_collect', null);
    ep.emit('is_follow', null);
  } else {
    UserCollect.getUserCollect(currentUser._id, activity_id, ep.done('is_collect'));
    UserFollow.getUserFollow(currentUser._id, activity_id, ep.done('is_follow'));
  }
};

exports.create = function (req, res, next) {
  res.render('activity/edit',{
    active: 'activity',
    tabs: config.activityTabs,
    tabValue: 'imweb'
  });
};

exports.put = function (req, res, next) {
  console.log(req.body);
  //for marktang
  if (!req.body.title || !req.body.content || !req.body.tab) {
    res.render('/activity/edit', {
      content_from_marktang: req.body.content || ''
    });
    return;
  }
  saveActivity(req, next, function (err, activity) {
      if (err || !activity) {
        res.send({
          ret: 400
        });
      } else {
        res.redirect('/activity/tab/'+activity.tab);
      }
  });
};

exports.list = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var tab = req.params.tab || 'imweb';
  var sort = req.params.sort || 'default';  // 根据不同的参数决定文章排序方式
  var sortMap = {
    'hot': '-visit_count -collect_count -reply_count -create_at',
    'latest': '-create_at',
    'reply': '-reply_count',
    'default': '-create_at'
  };
  var sortType = sortMap[sort] || sortMap['default'];

  var proxy = new EventProxy();
  proxy.fail(next);
  // 取主题
  var query = {};
  if (tab && tab !== 'all') {
    query.tab = tab;
  }
  var limit = config.list_activity_count;
  var options = {
    skip: (page - 1) * limit,
    limit: limit,
    sort: sortType
  };
  // var optionsStr = JSON.stringify(query) + JSON.stringify(options);
  // console.log(optionsStr);
  Activity.getActivitiesByQuery(query, options, proxy.done('activities', function (activities) {
    //console.log(activities);
    return activities.map(function(activity){
      return dataAdapter.outActivity(activity);
    });//activityMock;
  }));

  // 取分页数据
  var pagesCacheKey = JSON.stringify(query) + 'activity_pages';
  cache.get(pagesCacheKey, proxy.done(function (pages) {
    if (pages) {
      proxy.emit('pages', pages);
    } else {
      Activity.getCountByQuery(query, proxy.done(function (all_activities_count) {
        var pages = Math.ceil(all_activities_count / limit);
        cache.set(pagesCacheKey, pages, 60 * 1);
        proxy.emit('pages', pages);
      }));
    }
  }));
  // END 取分页数据

  // 取排行榜上的用户
  cache.get('tops', proxy.done(function (tops) {
    if (tops) {
      proxy.emit('tops', tops);
    } else {
      User.getUsersByQuery(
        { is_block: false },
        { limit: 10, sort: '-score' },
        proxy.done('tops', function (tops) {
          // console.log(tops);
          cache.set('tops', tops, 60 * 1);
          return tops;
        })
      );
    }
  }));
  // END 取排行榜上的用户

  var tabName = renderHelper.activityTypeName(tab);

  proxy.all('activities', 'pages', 'tops',
    function (activities, pages, tops) {
      res.render('activity/list', {
        active: 'activity',
        activities: activities,
        current_page: page,
        list_activity_count: limit,
        tops: tops,
        pages: pages,
        tabs: config.activityTabs,
        tab: tab,
        base: '/activity/tab/' + tab,
        pageTitle: tabName && (tabName + '活动'),
      });
    });
}

exports.showEdit = function (req, res, next) {
  var activity_id = req.params.tid;

  Activity.getActivity(activity_id, function (err, activity) {
    if (!activity) {
      res.render404('此活动不存在或已被删除。');
      return;
    }

    if (String(activity.author_id) === String(req.session.user._id) || req.session.user.is_admin) {
      res.render('activity/edit', {
        active: 'activity',
        action: 'edit',
        activity_id: activity._id,
        title: activity.title,
        content: activity.content,
        begin_time: activity.begin_time,
        end_time: activity.end_time,
        location_str: activity.location_str,
        tabValue: activity.tab,
        tabs: config.activityTabs
      });
    } else {
      res.renderError('对不起，你不能编辑此活动。', 403);
    }
  });
};

exports.update = function (req, res, next) {
    var json = req.body.json === 'true';
    var activity_id = req.params.tid;
    var title = escapeHtml(validator.trim(req.body.title));
    var tab = validator.escape(validator.trim(req.body.tab));
    var content = validator.trim(req.body.content || req.body.t_content);

    var ep = new EventProxy();
    ep.fail(next);
    ep.on('done', function(activity) {
        ep.unbind();
        if (json) {
            res.send({
                ret: 0,
                data: dataAdapter.outActivity(activity)
            });
        } else {
            res.redirect('/activity/' + activity._id);
        }
    });
    ep.on('fail', function(msg, activity) {
        ep.unbind()
        activity = activity || {};
        if (json) {
            res.send({
                ret: 400,
                msg: msg
            });
        } else {
            return res.render('activity/edit', {
                active: 'activity',
                action: 'edit',
                edit_error: msg,
                activity_id: activity._id || '',
                content: activity.content || '',
                tabs: config.tabs
            });
        }
    });
    var user = req.session.user;
    Activity.getActivityById(activity_id, ep.done(function(activity, tags) {
        if (!activity) {
            return ep.emit('faile',  '此活动不存在或已被删除。');
        }
        if (!tools.idEqual(activity.author_id, user._id) && !user.is_admin) {
            return ep.emit('faile', '无操作权限。', activity);
        }
        // 得到所有的 tab, e.g. ['ask', 'share', ..]
        var allTabs = config.tabs.map(function (tPair) {
            return tPair[0];
        });
        // if (!config.regExps.activityTitle.test(title)
        //     || !config.regExps.activityContent.test(content)
        //     || !_.contains(allTabs, tab)
        // ) {
        //     return ep.emit('fail', 'param error', activity);
        // }
        activity.title = title;
        activity.content = content;
        question.pic = tools.genPicFromContent(content);
        activity.summary = tools.genActivitySummary(content, config.topic_summary_len);
        activity.tab = tab;
        activity.update_at = new Date();
        activity.save(ep.done(function() {
            at.sendMessageToMentionUsers(content, activity._id, user._id);
            ep.emit('done', activity);
        }));
    }));
};

exports.delete = function (req, res, next) {
  //删除话题, 话题作者activity_count减1
  //删除回复，回复作者reply_count减1
  //删除activity_collect，用户collect_activity_count减1

  var activity_id = req.params.tid;
  var ep = tools.createJsonEventProxy(res, next);

  Activity.getFullActivity(activity_id, function (err, err_msg, activity, author, replies) {
    if (err) {
      return ep.emit('fail', 403, err.message);
    }
    if (!req.session.user.is_admin && !(activity.author_id.equals(req.session.user._id))) {
      return ep.emit('fail', 403, '无权限');
    }
    if (!activity) {
      return ep.emit('fail', 403, '此话题不存在或已被删除。');
    }
    author.score -= 5;
    author.activity_count -= 1;
    author.save();

    activity.deleted = true;
    activity.save(function (err) {
      if (err) {
        return res.send({ success: false, message: err.message });
      }
      return ep.emit('done');
    });
  });
};
