var Topic = require('../proxy').Topic;
var User = require('../proxy').User;
var Reply = require('../proxy').Reply;
var Banner = require('../proxy').Banner;
var Activity = require('../proxy').Activity;
var Column=require('../proxy').Column;
var TopicColumn=require('../proxy').TopicColumn;
var _ = require('lodash');
var tools = require('../common/tools');
var EventProxy = require('eventproxy');
var config = require('../config');
var cache = require('../common/cache');
var validator = require('validator');
var dataAdapter = require('../common/dataAdapter');
var renderHelper = require('../common/render_helper');

function formatAvatar(url) {
  // www.gravatar.com 被墙
  url = url.replace('//www.gravatar.com', '//gravatar.com');
  // 让协议自适应 protocol
  if (url.indexOf('http:') === 0) {
          url = url.slice(5);
  }

  //如果没有gravatar头像，则用默认
  if (url.indexOf("gravatar.com") >= 0 && url.indexOf("d=retro") < 0) {
          url += "&d=retro";
  }
  // 如果是 github 的头像，则限制大小
  if (url.indexOf('githubusercontent') !== -1) {
          url += '&s=120';
  }
  return url;
}

function html_encode(str) {
  var s = "";
  if (str.length == 0) return "";
  s = str.replace(/&/g, "&gt;");
  s = s.replace(/</g, "&lt;");
  s = s.replace(/>/g, "&gt;");
  s = s.replace(/ /g, "&nbsp;");
  s = s.replace(/\'/g, "&#39;");
  s = s.replace(/\"/g, "&quot;");
  s = s.replace(/\n/g, "<br>");
  return s;
}

exports.editUser = function(req, res, next){
        var user_name = req.params.name;
        var ep = new EventProxy();
        ep.fail(next);
        User.getUserByLoginName(user_name, function(err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                res.send({
                    ret: 400,
                    data: null
                });
                return;
            }
            ep.emit('user', user);
            Topic.queryAuthorTopic(user._id, +new Date(), 100, ep.done('topic'));
        });

        ep.all('topic', 'user', function(topic, user) {
            for (var i = 0, len = topic.length; i < len; i++) {
                topic[i].summary = html_encode(topic[i].summary);
            }
            user.topic = topic;
            res.render('admin/user/edit',{
                user:user
            });

        });
/*     proxy.all('topics', 'tops', 'no_reply_topics', 'pages', 'topic_caculate',
            function(topics, tops, no_reply_topics, pages, topic_caculate) {
                res.render('admin/:name/edits', {
                });*/
};

exports.saveUser = function(req, res, next) {
    var updated = {};
    _.each(
        ['name', /*'company', */'comp_mail', /*'email', */'score'],
        function(item) {
            if (req.body[item] !== undefined) {
                updated[item] = validator.trim(req.body[item]);
            }
        }
    );
    var oldPass = req.body.old_pass || '';
    var requirePassCheck = updated.pass !== undefined;
    var ep = new EventProxy();

    ep.fail(next);
    ep.on('fail', function(ret, msg) {
        ep.unbind();
        var data = _.extend({}, updated, dataAdapter.outUserAll(req.session.user), {
            error: msg,
            ret: ret,
            group: req.params.group || 'account',
            pass: ''
        });
        res.render('user/setting', data);
    });


    if (!validator.isNumeric(updated.score)) {
        return ep.emit('prop_err', '声望必须为数字。');
    }

    console.log('---')
    User.getUserById(req.body["_id"], ep.done(function(user) {
        ep.emit('user', user);
    }));

    ep.all('user', function(user) {
        _.extend(user, updated);
        user.save(ep.done('user_save'));
        res.redirect('/admin/user/all');
    });

    ep.all('user_save', function(user) {
        ep.unbind();
        req.session.user = user.toObject({
            virtual: true
        });
    });

};

exports.replyForTopic = function(req, res, next){
    Reply.getRepliesByTopicId(req.params.tid, function(err, replies){
        res.render('admin/reply/index',{"layout":false,"replies":replies});
    });
};

exports.topic = function(req, res, next){
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var tab = 'all';
  var sort = 'default';  // 根据不同的参数决定文章排序方式
  var sortMap = {
    'hot': '-visit_count -collect_count -reply_count -create_at',
    'latest': '-create_at',
    'reply': '-reply_count',
    'default': '-create_at'
  };
  var sortType = sortMap[sort];

  var proxy = new EventProxy();
  proxy.fail(next);
  // 取主题
  var query = {};
  var limit = config.list_topic_count;
  var options = {
    skip: (page - 1) * limit,
    limit: limit,
    sort: sortType
  };

  Topic.getTopicsByQuery(query, options, proxy.done('topics', function (topics) {
    return topics;
  }));

  Column.getColumnsByQuery({},{},proxy.done('columns',function(columns){
    return columns;
  }));


  // 取分页数据
  var pagesCacheKey = JSON.stringify(query) + 'pages';
  cache.get(pagesCacheKey, proxy.done(function (pages) {
    if (pages) {
      proxy.emit('pages', pages);
    } else {
      Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
        var pages = Math.ceil(all_topics_count / limit);
        cache.set(pagesCacheKey, pages, 60 * 1);
        proxy.emit('pages', pages);
      }));
    }
  }));
  // END 取分页数据

//   var tabs = [['all', '全部']].concat(config.tabs);
  var tabName = renderHelper.tabName(tab);

  var selectedColumnId=req.query.columnid;

  proxy.all('topics', 'pages','columns',/*'topicColumns',*/
    function (topics, pages, columns,topicColumns) {
      res.render('admin/topic/index', {
        topics: _topicFormat(topics),
        current_page: page,
        list_topic_count: limit,
        pages: pages,
        // tabs: tabs,
        tab: tab,
        sort: sort,
        columns: columns,
        topicColumns: topicColumns,
        selectedColumnId: selectedColumnId,
        base: '/admin/topic/all',
        pageTitle: tabName && (tabName + '版块'),
        layout: false
      });
    });

  if(selectedColumnId){
    TopicColumn.getTopicColumnsBycolumnId(selectedColumnId,{},proxy.done('topicColumns',function(topicColumns){
        var res=topicColumns.map(function(item){
            return item.topic_id;
        });
        return res;
    }))
  }
  else{
      proxy.emit('topicColumns',[]);
  }
};

//topic类型过滤器
var _topicFormat = function (topics) {
  var arr = [];
  for (var i = 0, len = topics.length; i < len; i++) {
    if (topics[i].type && topics[i].type == 1) {
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
  return topics;
}

exports.user = function(req, res, next){
	//查询所有用户

	User.getAllUsers(function(results){
		user_list = results;
        for(var i in user_list){
            user_list[i]['friendly_create_at'] = tools.formatDate(user_list[i].create_at, false);
            user_list[i]['friendly_update_at'] = tools.formatDate(user_list[i].update_at, false);
        }
		res.render('admin/user/index',{"layout":false,"users":user_list})
	});
};

exports.reply = function(req, res, next){
	Reply.replyList2(function(results){
		reply_list = results;
		//date format
		for(var i in reply_list){
			reply_list[i]['friendly_create_at'] = tools.formatDate(reply_list[i].create_at, false);
			reply_list[i]['friendly_update_at'] = tools.formatDate(reply_list[i].update_at, false);
		}
		res.render('admin/reply/index',{"layout":false,"replies":reply_list})
	});
};

//获取column管理界面
exports.column=function(req,res,next){
    var page=parseInt(req.query.page) || 1; 

    var proxy = new EventProxy();
    proxy.fail(next);

    proxy.all('columns','pages',function(columns,pages){
        columns=columns.map(function(column){
            return dataAdapter.outColumn(column);
        });
        console.log(columns);
        res.render('admin/column/index',{
            columns: columns,
            base: '/admin/column/all',
            current_page: page,
            pages: pages,
            layout: false
        });
    });

    //获取分页专栏数据    
    var limit = config.list_activity_count;
    var options = {
        skip: (page - 1) * limit,
        limit: limit
    };
    Column.getColumnsByQuery({},options,proxy.done(function(columns){
        if(columns && columns.length>0){
            proxy.after('column',columns.length,function(colums){
                proxy.emit('columns',colums);
            });

            columns.map(function(column){
                User.getUserById(column.owner_id,proxy.done('column',function(owner){
                    column.owner=owner;
                    return column;
                }));
            })
        }
        else{
            proxy.emit('columns',[]);
        }
    }));

    //获取页码数目
    Column.getCountByQuery({},proxy.done('pages',function(pages){
        return Math.ceil(pages/limit);
    }));
};

exports.banner = function(req, res, next){
    Banner.bannerList(function(results) {
        res.render('admin/banner/index',{'layout':false, 'banners': results});
    });
};

exports.addBanner = function(req, res, next) {
    res.render('admin/banner/add', {isNew: true});
};

exports.saveBanner = function(req, res, next) {
    var updated = {};
    var bid = req.body.bid;
    var ep = EventProxy.create();
    _.each(
        ['image', 'link', 'background', 'index', 'status'],
        function(item) {
            if (req.body[item] !== undefined) {
                updated[item] = validator.trim(req.body[item]);
            }
        }
    );
    if (!bid) { // 新建
        Banner.newAndSave(updated, function (results) {
            res.redirect('all');
        });
    } else { // 修改
        ep.on('fail', function(ret, msg) {
            ep.unbind();
            res.send({ret: ret || 400, msg: msg || ''});
        });
        ep.on('done', function() {
            res.redirect('all');
        });

        Banner.getBannerById(bid, function(banner) {
            if (!banner) {
                return ep.emit('fail', 401, 'no banner');
            }
            ep.emit('banner', banner);
        });

        ep.all('banner', function(banner) {
            _.extend(banner, updated);
            banner.save(ep.emit('done'));
        });
    }
};

exports.removeBanner = function(req, res, next) {
    var bid = req.body.id;
    var ep = EventProxy.create();
    ep.on('fail', function(ret, msg) {
        ep.unbind();
        res.send({ret: ret || 400, msg: msg || ''});
    });
    ep.on('done', function() {
        res.send({ret: 0});
    });

    Banner.getBannerById(bid, function(banner) {
        if (!banner) {
            return ep.emit('fail', 401, 'no banner');
        }
        ep.emit('banner', banner);
    });

    ep.all('banner', function(banner) {
        banner.remove();
        ep.emit('done');
    });

};

exports.editBanner = function(req, res, next) {
    var bid = req.params.bid;
    var ep = EventProxy.create();
    Banner.getBannerById(bid, function(banner) {
        if (!banner) {
            return ep.emit('fail', 401, 'no banner');
        }
        ep.emit('banner', banner);
    });
    ep.all('banner', function(banner) {
        res.render('admin/banner/add', {banner: banner, isNew: false});
    });
};

exports.activity = function(req, res, next) {
    Activity.list(function(results) {
        res.render('admin/activity/index',{'layout':false, 'activities': results});
    });
}
exports.addActivity = function(req, res, next) {
    res.render('admin/activity/add', {isNew: true});
};

exports.saveActivity = function(req, res, next) {
    var updated = {};
    var acid = req.body.acid;
    var ep = EventProxy.create();
    _.each(
        ['image', 'link', 'title', 'desc', 'pptlink'],
        function(item) {
            if (req.body[item] !== undefined) {
                updated[item] = validator.trim(req.body[item]);
            }
        }
    );
    if (!acid) { // 新建
        Activity.newAndSave(updated, function (results) {
            res.redirect('all');
        });
    } else { // 修改
        ep.on('fail', function(ret, msg) {
            ep.unbind();
            res.send({ret: ret || 400, msg: msg || ''});
        });
        ep.on('done', function() {
            res.redirect('all');
        });

        Activity.getActivityById(acid, function(activity) {
            if (!activity) {
                return ep.emit('fail', 401, 'no activity');
            }
            ep.emit('activity', activity);
        });

        ep.all('activity', function(activity) {
            _.extend(activity, updated);
            activity.save(ep.emit('done'));
        });
    }
};

exports.editActivity = function(req, res, next) {
    var acid = req.params.acid;
    var ep = EventProxy.create();
    Activity.getActivityById(acid, function(activity) {
        if (!activity) {
            return ep.emit('fail', 401, 'no activity');
        }
        ep.emit('activity', activity);
    });
    ep.all('activity', function(activity) {
        res.render('admin/activity/add', {activity: activity, isNew: false});
    });
};

exports.removeActivity = function(req, res, next) {
    var acid = req.body.id;
    var ep = EventProxy.create();
    ep.on('fail', function(ret, msg) {
        ep.unbind();
        res.send({ret: ret || 400, msg: msg || ''});
    });
    ep.on('done', function() {
        res.send({ret: 0});
    });

    Activity.getActivityById(acid, function(activity) {
        if (!activity) {
            return ep.emit('fail', 401, 'no activity');
        }
        ep.emit('activity', activity);
    });

    ep.all('activity', function(activity) {
        activity.remove();
        ep.emit('done');
    });

};
