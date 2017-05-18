/*!
 * nodeclub - controllers/topic.js
 */

/**
 * Module dependencies.
 */

var validator = require('validator');
var at = require('../common/at');
var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var TopicCollect = require('../proxy').TopicCollect;
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

function html_encode(str){
    var s = "";
    if (str.length == 0) return "";
    s = str.replace(/&/g, ">");
    s = s.replace(/</g, "<");
    s = s.replace(/>/g, ">");
    s = s.replace(/ /g, " ");
    s = s.replace(/\'/g, "\'");
    s = s.replace(/\"/g, "\"");
    s = s.replace(/\n/g, "<br>");
    return s;
}

/**
 * Topic page
 *
 * @param  {HttpRequest} req
 * @param  {HttpResponse} res
 * @param  {Function} next
 */
exports.index = function (req, res, next) {
  function isUped(user, reply) {
    if (!reply.ups) {
      return false;
    }
    return reply.ups.indexOf(user._id) !== -1;
  }

  var topic_id = req.params.tid;
  var currentUser = req.session.user;

  if (topic_id.length !== 24) {
    return res.render404('此话题不存在或已被删除。');
  }
  var events = ['topic', 'other_topics', 'no_reply_topics', 'is_collect'];
  var ep = EventProxy.create(events,
    function (topic, other_topics, no_reply_topics, is_collect) {
      res.render('topic/index', {
        _layoutFile: false,
        active: 'topic',
        topic: topic,
        author_other_topics: other_topics,
        no_reply_topics: no_reply_topics,
        is_uped: isUped,
        is_collect: is_collect,
        tabs: config.tabs
      });
    });

  ep.fail(next);

  Topic.getFullTopic(topic_id, ep.done(function (message, topic, author, replies) {
    if (message) {
      logger.error('getFullTopic error topic_id: ' + topic_id)
      return res.renderError(message);
    }

    topic.visit_count += 1;
    topic.save();

    // format date
    topic.friendly_create_at = tools.formatDate(topic.create_at, true);
    topic.friendly_update_at = tools.formatDate(topic.update_at, true);

    // topic.author = author;
    topic.author = dataAdapter.outUser(author || {});

    var mainReplies = dataAdapter.appendSubRepliesToReplies(replies);
    topic.replies = dataAdapter.outReplies(mainReplies);

    // 点赞数排名第三的回答，它的点赞数就是阈值
    topic.reply_up_threshold = (function () {
      var allUpCount = replies.map(function (reply) {
        return reply.ups && reply.ups.length || 0;
      });
      allUpCount = _.sortBy(allUpCount, Number).reverse();

      var threshold = allUpCount[2] || 0;
      if (threshold < 3) {
        threshold = 3;
      }
      return threshold;
    })();

    ep.emit('topic', topic);

    // get other_topics
    var options = { limit: 5, sort: '-last_reply_at' };
    var query = { author_id: topic.author_id, _id: { '$nin': [topic._id] } };
    Topic.getTopicsByQuery(query, options, ep.done('other_topics'));

    // get no_reply_topics
    cache.get('no_reply_topics', ep.done(function (no_reply_topics) {
      if (no_reply_topics) {
        ep.emit('no_reply_topics', no_reply_topics);
      } else {
        Topic.getTopicsByQuery(
          { reply_count: 0, tab: { $ne: 'job' } },
          { limit: 5, sort: '-create_at' },
          ep.done('no_reply_topics', function (no_reply_topics) {
            cache.set('no_reply_topics', no_reply_topics, 60 * 1);
            return no_reply_topics;
          }));
      }
    }));
  }));

  if (!currentUser) {
    ep.emit('is_collect', null);
  } else {
    TopicCollect.getTopicCollect(currentUser._id, topic_id, ep.done('is_collect'));
  }
};

exports.create = function (req, res, next) {
  res.render('topic/edit', {
    tabs: config.tabs
  });
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

/**
 * 文章列表
 */
exports.list = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var tab = req.params.tab || 'all';
  var sort = req.query.sort;  // 根据不同的参数决定文章排序方式
  var sortMap = {
    'default': '-create_at',
    'hot': '-visit_count',
    'latest': '-create_at',
    'reply': '-reply_count'
  };
  var sortType = sortMap[sort] || sortMap['default'];

  var proxy = new EventProxy();
  proxy.fail(next);
  // 取主题
  var query = {};
  if (tab && tab !== 'all') {
    if (tab === 'good') {
      query.good = true;
    } else {
      query.tab = tab;
    }
  }

  if (sort === 'hot') {
    query['create_at'] =  {
      $gte: new Date(new Date().getTime() - 60*60*24*90*1000).toISOString()
    }
  }

  var limit = config.list_topic_count;
  var options = {
    skip: (page - 1) * limit,
    limit: limit,
    sort: sortType
  };
  // var optionsStr = JSON.stringify(query) + JSON.stringify(options);
  Topic.getTopicsByQuery(query, options, proxy.done('topics', function (topics) {
    return topics;
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

  // 取排行榜上的用户
  cache.get('tops', proxy.done(function (tops) {
    if (tops) {
      proxy.emit('tops', tops);
    } else {
      User.getUsersByQuery(
        { is_block: false },
        { limit: 10, sort: '-score' },
        proxy.done('tops', function (tops) {
          cache.set('tops', tops, 60 * 1);
          return tops;
        })
      );
    }
  }));
  // END 取排行榜上的用户

  var tabs = [['all', '全部']].concat(config.tabs);
  var tabName = renderHelper.tabName(tab);

  proxy.all('topics', 'pages', 'tops',
    function (topics, pages, tops) {
      res.render('topic/list', {
        _layoutFile: false,
        active: 'topic',
        topics: _topicFormat(topics),
        current_page: page,
        list_topic_count: limit,
        tops: tops,
        pages: pages,
        tabs: tabs,
        tab: tab,
        sort: sort,
        base: '/topic/tab/' + tab + (sort && sort !== 'undefined' ? '?sort=' + sort : ''),
        pageTitle: tabName && (tabName + '版块'),
      });
    });
}

// exports.put = function (req, res, next) {
//   var title   = validator.trim(req.body.title);
//   var tab     = validator.trim(req.body.tab);
//   var content = validator.trim(req.body.t_content);

//   // 得到所有的 tab, e.g. ['ask', 'share', ..]
//   var allTabs = config.tabs.map(function (tPair) {
//     return tPair[0];
//   });

//   // 验证
//   var editError;
//   if (title === '') {
//     editError = '标题不能是空的。';
//   } else if (title.length < 5 || title.length > 100) {
//     editError = '标题字数太多或太少。';
//   } else if (!tab || allTabs.indexOf(tab) === -1) {
//     editError = '必须选择一个版块。';
//   } else if (content === '') {
//     editError = '内容不可为空';
//   }
//   // END 验证

//   if (editError) {
//     res.status(422);
//     return res.render('topic/edit', {
//       edit_error: editError,
//       title: title,
//       content: content,
//       tabs: config.tabs
//     });
//   }

//   Topic.newAndSave(title, content, tab, req.session.user._id, function (err, topic) {
//     if (err) {
//       return next(err);
//     }

//     var proxy = new EventProxy();

//     proxy.all('score_saved', function () {
//       res.redirect('/topic/' + topic._id);
//     });
//     proxy.fail(next);
//     User.getUserById(req.session.user._id, proxy.done(function (user) {
//       user.score += 5;
//       user.topic_count += 1;
//       user.save();
//       req.session.user = user;
//       proxy.emit('score_saved');
//     }));

//     //发送at消息
//     at.sendMessageToMentionUsers(content, topic._id, req.session.user._id);
//   });
// };


exports.put = function (req, res, next) {
  var json = req.body.json === 'true';
  //for marktang
  if (!json && req.body.content) {
    res.render('topic/edit', {
      tabs: config.tabs,
      content_from_marktang: req.body.content || ''
    });
    return;
  }
  saveTopic(req, next, function (err, topic) {
    if (!json) {
      if (err || !topic) {
        return res.render('topic/edit', {
          edit_error: err,
          title: topic.title,
          content: topic.content,
          tabs: config.tabs
        });
      } else {
        res.redirect('/topic/' + topic._id);
      }
    } else {
      if (err || !topic) {
        res.send({
          ret: 400
        });
      } else {
        res.send({
          ret: 0,
          data: dataAdapter.outTopic(topic)
        });
      }
    }
  });
};

function saveTopic(req, next, callback) {
  var title = escapeHtml(validator.trim(req.body.title));
  var tab = validator.escape(validator.trim(req.body.tab));
  var content = validator.trim(req.body.content || req.body.t_content);
  var type = escapeHtml(req.body.type || 0);
  var cover =  escapeHtml(req.body.cover || 0);
  var reprint = req.body.reprint;
  if (reprint && reprint.length != 0 && reprint != "false") {
    reprint = req.body.link;
  } else {
    reprint = "";
  }

  var allTabs = config.tabs.map(function (tPair) {
    return tPair[0];
  });

  var user = req.session.user;
  var ep = new EventProxy();
  ep.fail(next);


  Topic.newAndSave(title, type, content, tab, cover, reprint, user._id, ep.done('topic'));
  ep.all('topic', function (topic) {
    User.getUserById(user._id, ep.done(function (user) {
      user.score += 5;
      user.topic_count += 1;
      user.save();
      req.session.user = user;
      ep.emit('score_saved', user);
    }));
    // 给team成员发送
    //if (user.company) {
    //User.getTeamMember(
    //user.company,
    //user.team || '' ,
    //ep.done(function(members) {
    //mail.sendNewTopicToTeamMembers({
    //members: members,
    //user: user,
    //topic: topic
    //});
    //})
    //);
    //}
    if (type == 0) {
      User.listOrderByTeam(0, 1000, function (err, members) {
        if (err) {
          return;
        }
        mail.sendNewTopicToTeamMembers({
          members: members,
          user: user,
          topic: topic
        });
      });
      //发送at消息
      at.sendMessageToMentionUsers(content, topic._id, req.session.user._id);
    }
  });

  ep.all('topic', 'score_saved', function (topic, user) {
    callback(null, topic);
  });
};

exports.showEdit = function (req, res, next) {
  var topic_id = req.params.tid;

  Topic.getTopicById(topic_id, function (err, topic, tags) {
    if (!topic) {
      res.render404('此话题不存在或已被删除。');
      return;
    }

    if (String(topic.author_id) === String(req.session.user._id) || req.session.user.is_admin) {
      res.render('topic/edit', {
        action: 'edit',
        topic_id: topic._id,
        title: topic.title,
        content: topic.content,
        tab: topic.tab,
        tabs: config.tabs
      });
    } else {
      res.renderError('对不起，你不能编辑此话题。', 403);
    }
  });
};

exports.update = function (req, res, next) {
    var json = req.body.json === 'true';
    var topic_id = req.params.tid;
    var title = escapeHtml(validator.trim(req.body.title));
    var tab = validator.escape(validator.trim(req.body.tab));
    var content = validator.trim(req.body.content || req.body.t_content);
    var cover = escapeHtml(validator.trim(req.body.cover));

    var ep = new EventProxy();
    ep.fail(next);
    ep.on('done', function(topic) {
        ep.unbind();
        if (json) {
            res.send({
                ret: 0,
                data: dataAdapter.outTopic(topic)
            });
        } else {
            //res.redirect('/topic/' + topic._id);
            res.redirect('/');
        }
    });
    ep.on('fail', function(msg, topic) {
        ep.unbind()
        topic = topic || {};
        if (json) {
            res.send({
                ret: 400,
                msg: msg
            });
        } else {
            return res.render('topic/edit', {
                action: 'edit',
                edit_error: msg,
                topic_id: topic._id || '',
                content: topic.content || '',
                tabs: config.tabs,
                cover: cover
            });
        }
    });
    var user = req.session.user;
    Topic.getTopicById(topic_id, ep.done(function(topic, tags) {
        if (!topic) {
            return ep.emit('faile',  '此话题不存在或已被删除。');
        }
        if (!tools.idEqual(topic.author_id, user._id) && !user.is_admin) {
            return ep.emit('faile', '无操作权限。', topic);
        }
        // 得到所有的 tab, e.g. ['ask', 'share', ..]
        var allTabs = config.tabs.map(function (tPair) {
            return tPair[0];
        });
        if (!config.regExps.topicTitle.test(title)
            || !config.regExps.topicContent.test(content)
            || !_.contains(allTabs, tab)
        ) {
            return ep.emit('fail', 'param error', topic);
        }
        topic.title = title;
        topic.content = content;
        topic.summary = html_encode(tools.genSummaryFromContent(content, config.topic_summary_len));
        topic.tab = tab;
        topic.cover = cover;
        topic.update_at = new Date();
        topic.save(ep.done(function() {
            at.sendMessageToMentionUsers(content, topic._id, user._id);
            ep.emit('done', topic);
        }));
    }));
};

exports.delete = function (req, res, next) {
  //删除话题, 话题作者topic_count减1
  //删除回复，回复作者reply_count减1
  //删除topic_collect，用户collect_topic_count减1

  var topic_id = req.params.tid;
  var ep = tools.createJsonEventProxy(res, next);

  Topic.getFullTopic(topic_id, function (err, err_msg, topic, author, replies) {
    if (err) {
      return ep.emit('fail', 403, err.message);
    }
    if (!req.session.user.is_admin && !(topic.author_id.equals(req.session.user._id))) {
      return ep.emit('fail', 403, '无权限');
    }
    if (!topic) {
      return ep.emit('fail', 403, '此话题不存在或已被删除。');
    }
    author.score -= 5;
    author.topic_count -= 1;
    author.save();

    topic.deleted = true;
    topic.save(function (err) {
      if (err) {
        return res.send({ success: false, message: err.message });
      }
      return ep.emit('done');
    });
  });
};

// 收藏
exports.collect = function (req, res, next) {
    var topic_id = req.params.tid;
    var ep = EventProxy.create();
    ep.fail(next);
    ep.on('fail', function() {
        res.send({
            ret: 1
        });
    });

    Topic.getTopic(topic_id, ep.done(function(topic) {
        if (!topic) {
            return ep.emit('fail');
        }
        return ep.emit('topic', topic);
    }));

    User.getUserById(req.session.user._id, ep.done(function(user) {
        if (!user) {
            return ep.emit('fail');
        }
        return ep.emit('user', user);
    }));
    ep.all('topic', 'user', function(topic, user) {
        TopicCollect.getTopicCollect(user._id, topic._id, ep.done(function(item) {
            if (item) {
              item.remove(function(){
                ep.emit('collect', false)
              });
            } else {
                TopicCollect
                    .newAndSave(user._id, topic._id,  function(){
                      ep.emit('collect', true);
                    });
            }
        }));
    });

    ep.all('topic', 'user', 'collect', function(topic, user) {
        TopicCollect.getTopicCollectCount(topic._id, ep.done(function(count) {
            topic.collect_count = count;
            topic.save(function(){
              ep.emit('object_updated', count);
            });
        }));
        TopicCollect.getUserCollectCount(user._id, ep.done(function(count) {
            user.collect_topic_count = count;
            user.save(function(){
              ep.emit('user_updated', count);
            });
        }));
    });

    ep.all(
        'collect', 'object_updated', 'user_updated',
        function(if_collect, collect_count, user_collect_count) {
            res.send({
                ret: 0,
                data: {
                  ifCollect: if_collect,
                  objectCollectCount: collect_count,
                  userCollectCount: user_collect_count
                }
            });
        }
    );
};

// 设为置顶
exports.top = function (req, res, next) {
  var topic_id = req.params.tid;
  var referer = req.get('referer');

  if (topic_id.length !== 24) {
    res.render404('此话题不存在或已被删除。');
    return;
  }
  Topic.getTopic(topic_id, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.render404('此话题不存在或已被删除。');
      return;
    }
    topic.top = !topic.top;
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      var msg = topic.top ? '此话题已置顶。' : '此话题已取消置顶。';
      res.render('notify/notify', { success: msg, referer: referer });
    });
  });
};

// 设为精华
exports.good = function (req, res, next) {
  var topicId = req.params.tid;
  var referer = req.get('referer');

  Topic.getTopic(topicId, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.render404('此话题不存在或已被删除。');
      return;
    }
    topic.good = !topic.good;
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      var msg = topic.good ? '此话题已加精。' : '此话题已取消加精。';
      res.render('notify/notify', { success: msg, referer: referer });
    });
  });
};

// 锁定主题，不可再回复
exports.lock = function (req, res, next) {
  var topicId = req.params.tid;
  var referer = req.get('referer');
  Topic.getTopic(topicId, function (err, topic) {
    if (err) {
      return next(err);
    }
    if (!topic) {
      res.render404('此话题不存在或已被删除。');
      return;
    }
    topic.lock = !topic.lock;
    topic.save(function (err) {
      if (err) {
        return next(err);
      }
      var msg = topic.lock ? '此话题已锁定。' : '此话题已取消锁定。';
      res.render('notify/notify', { success: msg, referer: referer });
    });
  });
};

exports.upload = function (req, res, next) {
  var isFileLimit = false;
  req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
    file.on('limit', function () {
      isFileLimit = true;

      res.json({
        success: false,
        msg: 'File size too large. Max is ' + config.file_limit
      })
    });

    store.upload(file, { filename: filename }, function (err, result) {
      if (err) {
        return next(err);
      }
      if (isFileLimit) {
        return;
      }
      res.json({
        success: true,
        url: result.url,
      });
    });

  });

  req.pipe(req.busboy);
};
