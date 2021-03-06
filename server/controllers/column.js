/**
 * Author:terrancewan
 * Date:2017/6/22
 */
var validator = require('validator');
var at = require('../common/at');
var User = require('../proxy').User;
var Column = require('../proxy').Column;
var Topic = require('../proxy').Topic;
var Reply = require('../proxy').Reply;
var UserFollow = require('../proxy').UserFollow;
var TopicColumn = require('../proxy').TopicColumn;
var Message=require('../proxy').Message;
var EventProxy = require('eventproxy');
var tools = require('../common/tools');
var store = require('../common/store');
var config = require('../config');
var _ = require('lodash');
var async = require('async');
var cache = require('../common/cache');
var logger = require('../common/logger');
var escapeHtml = require('escape-html');
var mail = require('../common/mail');
var dataAdapter = require('../common/dataAdapter');
var renderHelper = require('../common/render_helper');

//发送消息辅助方法
var message = require('../common/message');

/**
 * 某一专栏的详情页
 */
exports.index = function (req, res, next) {
  var column_id = req.params.cid;
  var currentUser = req.session.user;
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;

  if (column_id.length !== 24) {
    return res.render404('此专栏不存在。');
  }
  var events = ['column', 'is_follow', 'topics', 'pages'];
  var proxy = EventProxy.create(events,
    function (column, is_follow, topics, pages) {
      res.render('column/index', {
        active: 'column',
        column_id: column_id,
        column: dataAdapter.outColumn(column),
        topics: topics.map(function (item) {
          return dataAdapter.outTopic(item);
        }),
        current_page: page,
        pages: pages,
        is_follow: !!is_follow,
        base: '/column/'+column_id,
        _layoutFile: false
      });
    });

  proxy.fail(next);

  Column.getColumnById(column_id, function (err, column) {
    if (err || !column) {
      return res.renderError('此专栏不存在或已被删除: ' + column_id);
    }
    proxy.emit('column', column);
  });

  if (!currentUser) {
    proxy.emit('is_follow', null);
  } else {
    UserFollow.getUserFollow(currentUser._id, column_id, proxy.done('is_follow'));
  }

  var limit = config.list_activity_count;
  var options = {
    skip: (page - 1) * limit,
    limit: limit
  };
  // 取分页数据
  var pagesCacheKey = `column_${column_id}_pages`;
  cache.get(pagesCacheKey, proxy.done(function (pages) {
    if (pages) {
      proxy.emit('pages', pages);
    } else {
      TopicColumn.getColumnTopicCount(column_id, proxy.done(function (topic_count) {
        var pages = Math.ceil(topic_count / limit);
        cache.set(pagesCacheKey, pages, 60 * 1);
        proxy.emit('pages', pages);
      }));
    }
  }));
  // END 取分页数据

  TopicColumn.getTopicColumnsBycolumnId(column_id, options, proxy.done('items', function (items) {
    if (items && items.length > 0) {
      proxy.after('topic', items.length, function (topics) {
        proxy.emit('topics', topics);
      });
      var count = 0;
      async.whilst(
        function () {
          return count < items.length;
        },
        function (callback) {
          Topic.getTopicById(items[count].topic_id, function (err, topic) {
            User.getUserById(topic.author_id, function (err, author) {
              topic.author = dataAdapter.outUser(author || {});
              topic.friendly_create_at = tools.formatDate(topic.create_at, true);
              topic.friendly_update_at = tools.formatDate(topic.update_at, true);
              proxy.emit('topic', topic);
              count++;
              callback(null, count);
            });
          });
        }
      );
    } else {
      return proxy.emit('topics', []);
    }
  }));
};

/**
 * 所有专栏列表
 */
exports.list = function (req, res, next) {
  var currentUser = req.session.user;
  var page = parseInt(req.query.page, 10) || 1;
  var sort=req.query.sort;
  page = page > 0 ? page : 1;
  var sortMap = {
    'hot': '-follower_count -create_at',
    'latest': '-create_at'
  };
  if (!sortMap[sort]) {
    sort = 'hot';
  }
  var proxy = new EventProxy();
  proxy.fail(next);

  var limit = config.list_activity_count;
  var options = {
    skip: (page - 1) * limit,
    limit: limit,
    sort: sortMap[sort]
  };

  // 取分页数据
  var pagesCacheKey = 'column_list_pages';
  cache.get(pagesCacheKey, proxy.done(function (pages) {
    if (pages) {
      proxy.emit('pages', pages);
    } else {
      Column.getCountByQuery({
        deleted: false
      }, proxy.done(function (all_columns_count) {
        var pages = Math.ceil(all_columns_count / limit);
        cache.set(pagesCacheKey, pages, 60 * 1);
        proxy.emit('pages', pages);
      }));
    }
  }));
  // END 取分页数据

  Column.getColumnsByQuery({}, options, function (err, columns) {
    if (err) {
      return proxy.emit('fail');
    }
    if (columns && columns.length > 0) {
      proxy.after('column', columns.length, function (objects) {
        proxy.emit('columns', objects);
      });

      columns.map(function (column) {
        if (!currentUser) {
          proxy.emit('column', dataAdapter.outColumn(column));
        } else {
          UserFollow.getUserFollow(currentUser._id, column._id, proxy.done(function (item) {
            column.is_follow = !!item;
            proxy.emit('column', dataAdapter.outColumn(column));
          }));
        }
      });
    } else {
      proxy.emit('columns', []);
    }
  });

  proxy.all('columns', 'pages', function (columns, pages) {
    res.render('column/list', {
      active: 'column',
      columns: columns,
      list_column_count: limit,
      current_page: page,
      pages: pages,
      pageTitle: '专栏列表',
      sort: sort,
      base: '/column/list'+(req.query.sort ? '?sort='+req.query.sort : ''),
      _layoutFile: false
    });
  });
}

/**
 * 获取添加专栏页面
 */
exports.create = function (req, res, next) {
  res.render('column/edit', {
    isEdit: false,
    active: 'column',
    _layoutFile: false
  });
};

/**
 * 添加新专栏
 */
exports.put = function (req, res, next) {
  if (!req.body.title || !req.body.description || !req.body.cover) {
    req.body._layoutFile = false;
    req.body.isEdit = false
    res.render('/column/edit', req.body);
    return;
  }
  var title = escapeHtml(validator.trim(req.body.title));
  var description = req.body.description;
  var cover = req.body.cover;
  var user = req.session.user;

  Column.newAndSave(title, description, cover, user._id, function (err, column) {
    if (err || !column) {
      req.body._layoutFile = false;
      req.body.isEdit = false
      res.render('/column/edit', req.body);
      return;
    }
    res.redirect('/column/' + column._id);
  });
};

/**
 * 获取修改专栏页面
 */
exports.showEdit = function (req, res, next) {
  var column_id = req.params.cid;

  Column.getColumnById(column_id, function (err, column) {
    if (!column) {
      res.render404('此活动不存在或已被删除。');
      return;
    }

    if (req.session.user.is_admin) {
      res.render('column/edit', {
        active: 'column',
        isEdit: true,
        column_id: column._id,
        title: column.title,
        description: column.description,
        cover: column.cover,
        _layoutFile: false
      });
    } else {
      res.renderError('对不起，你不能编辑此专栏。', 403);
    }
  });
};

/**
 * 修改专栏
 */
exports.update = function (req, res, next) {
  var json = req.body.json === 'true';
  var column_id = req.params.cid;
  var title = escapeHtml(validator.trim(req.body.title));
  var description = req.body.description;
  var cover = req.body.cover;

  var ep = new EventProxy();
  ep.fail(next);
  ep.on('done', function (column) {
    ep.unbind();
    if (json) {
      res.send({
        ret: 0,
        data: dataAdapter.outColumn(column)
      });
    } else {
      res.redirect('/column/' + column._id);
    }
  });
  ep.on('fail', function (msg, column) {
    ep.unbind()
    column = column || {};
    if (json) {
      res.send({
        ret: 400,
        msg: msg
      });
    } else {
      return res.render('column/edit', {
        active: 'column',
        action: 'edit',
        isEdit: true,
        edit_error: msg,
        column_id: column._id,
        title: column.title,
        description: column.description,
        cover: column.cover,
        _layoutFile: false
      });
    }
  });
  var user = req.session.user;
  Column.getColumnById(column_id, ep.done(function (column) {
    if (!column) {
      return ep.emit('fail', '此活动不存在或已被删除。');
    }
    if (!user.is_admin) {
      return ep.emit('fail', '无操作权限。', column);
    }

    column.title = title;
    column.description = description;
    column.cover = cover;
    column.update_at = new Date();
    column.save(ep.done(function () {
      ep.emit('done', column);
    }));
  }));
};

/**
 * 删除专栏
 */
exports.delete = function (req, res, next) {
  var column_id = req.params.cid;
  var ep = tools.createJsonEventProxy(res, next);

  Column.getColumnById(column_id, function (err, column) {
    if (err) {
      return ep.emit('fail', 403, err.message);
    }
    if (!req.session.user.is_admin) {
      return ep.emit('fail', 403, '无权限');
    }
    if (!column) {
      return ep.emit('fail', 403, '此话题不存在或已被删除。');
    }
    column.topic_count = 0;
    column.follower_count = 0;
    column.deleted = true;
    column.save(function (err) {
      if (err) {
        return res.send({
          success: false,
          message: err.message
        });
      }
      // 删除专栏文章关系表
      TopicColumn.removeByColumnId(column_id, function (err) {
        if (err) {
          return ep.emit('fail', 403);
        }
        return ep.emit('topic_column_deleted');
      });
      // 删除用户关注表
      UserFollow.removeByObjectId(column_id, function (err) {
        if (err) {
          return ep.emit('fail', 403);
        }
        return ep.emit('user_follow_deleted');
      });

      //删除关联消息
      Message.removeMessageByColumnId(column_id,function(err){
        if(err){
          return ep.emit('fail',403);
        }
        return ep.emit('message_deleted');
      }); 

      ep.all('topic_column_deleted', 'user_follow_deleted', 'message_deleted', function () {
        ep.emit('done');
      });
    });
  });
};

/**
 * 向某专栏添加文章
 */
exports.addTopic = function (req, res, next) {
  var ep = tools.createJsonEventProxy(res, next);
  var column_id = req.body.cid;
  var topic_ids = req.body.tids;
  var user = req.session.user;
  if (!column_id || !topic_ids || !Array.isArray(topic_ids)) {
    return ep.emit('fail', 403, '参数错误！');
  }

  if (!user.is_admin) {
    return ep.emit('fail', 403, '无权限');
  }

  if (topic_ids.length > 0) {
    Column.getColumnById(column_id, function (err, column) {
      if (err || !column) {
        return ep.emit('fail', '此活动不存在或已被删除。');
      }

      ep.after('deal', topic_ids.length, function () {
        notificateSubscriber(user, column, function () {

        }); // 给关注者发送邮件通知

        ep.emit('done');
      });

      for (var i = 0; i < topic_ids.length; i++) {
        var topic_id = topic_ids[i];
        (function (topic_id) {
          TopicColumn.getTopicColumn(column_id, topic_id, function (err, item) {
            if (err) {
              return ep.emit('fail', 403);
            }
            if (item) { // 兼容重复添加
              ep.emit('deal');
            } else {
              TopicColumn.newAndSave(column_id, topic_id, function (err) {
                if (err) {
                  return ep.emit('fail', 403);
                }
                column.topic_count++;

                column.save(ep.done(function () {
                  ep.emit('deal');
                }))
              });
            }
          })
        })(topic_id);
      }
    });
  } else {
    ep.emit('done');
  }
}

function notificateSubscriber(fromUser, column, callback) {
  UserFollow.getUserFollowsByObjectId(column._id, {}, function (err, items) {
    if (err || !items || items.length === 0) {
      return;
    }

    //给关注者发送消息
    var master_ids = items.map(function (item) {
      return item.user_id;
    });
    message.sendColumnMessage(master_ids, column._id);

    var ep = new EventProxy();
    ep.after('user', items.length, function (users) {
      mail.sendColumnTopicToFollowers({
        followers: users,
        user: fromUser,
        column: column
      });

      callback();
    });
    items.map(function (item) {
      User.getUserById(item.user_id, function (err, user) {
        ep.emit('user', user);
      });
    });
  });
}

/**
 * 从某专栏中移除一篇文章
 */
exports.removeTopic = function (req, res, next) {
  var ep = tools.createJsonEventProxy(res, next);
  var column_id = req.body.cid;
  var topic_ids = req.body.tids;
  var user = req.session.user;
  if (!column_id || !topic_ids || !Array.isArray(topic_ids)) {
    return ep.emit('fail', 403, '参数错误！');
  }

  if (!user.is_admin) {
    return ep.emit('fail', 403, '无权限');
  }

  if (topic_ids.length > 0) {
    ep.after('deal', topic_ids.length, function () {
      ep.emit('done');
    });

    Column.getColumnById(column_id, function (err, column) {
      if (err || !column) {
        return ep.emit('fail', '此活动不存在或已被删除。');
      }

      for (var i = 0; i < topic_ids.length; i++) {
        var topic_id = topic_ids[i];
        (function (topic_id) {
          TopicColumn.getTopicColumn(column_id, topic_id, function (err, item) {
            if (err) {
              return ep.emit('fail', 403);
            }
            if (!item) { // 兼容重复删除
              ep.emit('deal');
            } else {
              item.remove(function (err) {
                if (err) {
                  return ep.emit('fail', 403);
                }
                column.topic_count--;
                column.save(ep.done(function () {
                  ep.emit('deal');
                }));
              });
            }
          });
        })(topic_id);
      }
    });
  } else {
    ep.emit('done');
  }
}
