/**
 * Author:terrancewan
 * Date:2017/6/22
 */
var validator = require('validator');
var at = require('../common/at');
var User = require('../proxy').User;
var Column = require('../proxy').Column;
var Topic = require('../proxy').Topic;
var UserFollow = require('../proxy').UserFollow;
var TopicColumn = require('../proxy').TopicColumn;
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

/**
 * 某一专栏的详情页
 */
exports.index = function (req, res, next) {
  var column_id = req.params.cid;
  var currentUser = req.session.user;

  if (column_id.length !== 24) {
    return res.render404('此专栏不存在。');
  }
  var events = ['column', 'is_follow', 'topics'];
  var ep = EventProxy.create(events,
    function (column, is_follow, topics) {
      res.render('column/index', {
        active: 'column',
        column: dataAdapter.outColumn(column),
        topics: topics.map(function(item){
          return dataAdapter.outTopic(item);
        }),
        is_follow: is_follow
      });
    });

  ep.fail(next);

  Column.getColumnById(column_id, ep.done(function (column) {
    if (!column) {
      return res.renderError('此专栏不存在或已被删除: ' + column_id);
    }
    ep.emit('column', column);
  }));

  if (!currentUser) {
    ep.emit('is_follow', null);
  } else {
    UserFollow.getUserFollow(currentUser._id, column_id, ep.done('is_follow'));
  }

  TopicColumn.getTopicColumnsBycolumnId(column_id, {}, ep.done('items', function (items) {
    for (var i = 0; i < items.length; i++) {
      Topic.getTopicById(items[i].topic_id, function (topic) {
        return ep.emit('topics', topic);
      });
    }
  }));

};

/**
 * 所有专栏列表
 */
exports.list = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var sortMap = {
    'hot': '-follower_count -create_at',
    'latest': '-create_at'
  };
  if (!sortMap[req.params.sort]) {
    req.params.sort = 'hot';
  }
  var proxy = new EventProxy();
  proxy.fail(next);

  var limit = config.list_activity_count;
  var options = {
    skip: (page - 1) * limit,
    limit: limit,
    sort: sortMap[req.params.sort]
  };
  // var optionsStr = JSON.stringify(query) + JSON.stringify(options);
  // console.log(optionsStr);
  Column.getColumnsByQuery({}, options, proxy.done('column', function (columns) {
    //console.log(column);
    return columns.map(function (column) {
      return dataAdapter.outColumn(column);
    });
  }));

  proxy.all('columns', function (columns) {
    res.render('column/list', {
      columns: columns,
      list_column_count: limit,
      current_page: page,
      pageTitle: '专栏列表',
    });
  });
}

/**
 * 获取添加专栏页面
 */
exports.create = function (req, res, next) {
  res.render('column/edit', {
    active: 'column'
  });
};

/**
 * 添加新专栏
 */
exports.put = function (req, res, next) {
  if (!req.body.title || !req.body.content || !req.body.tab) {
    res.render('/column/edit', req.body);
    return;
  }
  var title = escapeHtml(validator.trim(req.body.title));
  var description = req.body.description;
  var cover = req.body.cover;
  var user = req.session.user;

  Column.newAndSave(title, description, cover, user._id, function (err, column) {
    if (err || !column) {
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
        action: 'edit',
        column_id: column._id,
        title: column.title,
        description: column.description,
        cover: activity.cover
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
  var column_id = req.params.tid;
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
        edit_error: msg,
        column_id: column._id,
        title: column.title,
        description: column.description,
        cover: column.cover
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

  Column.getColumnById(column_id, function (err, err_msg, column) {
    if (err) {
      return ep.emit('fail', 403, err.message);
    }
    if (!req.session.user.is_admin) {
      return ep.emit('fail', 403, '无权限');
    }
    if (!column) {
      return ep.emit('fail', 403, '此话题不存在或已被删除。');
    }

    column.deleted = true;
    column.save(function (err) {
      if (err) {
        return res.send({
          success: false,
          message: err.message
        });
      }
      return ep.emit('done');
    });
  });
};

/**
 * 向某专栏添加一篇文章
 */
exports.addTopic = function (req, res, next) {
  var ep = tools.createJsonEventProxy(res, next);
  if (!req.body.cid || !req.body.tid) {
    return ep.emit('fail', 403, '参数错误！');
  }
  var column_id = req.body.cid;
  var topic_id = req.body.tid;
  var user = req.session.user;
  if (!user.is_admin) {
    return ep.emit('fail', 403, '无权限');
  }
  Column.getColumnById(column_id, ep.done(function (column) {
    if (!column) {
      return ep.emit('fail', '此活动不存在或已被删除。');
    }
    TopicColumn.newAndSave(column_id, topic_id, function (err, item) {
      if (err || !column) {
        return ep.emit('fail', 403);
      }
      column.topic_count++;
      column.save(ep.done(function () {
        ep.emit('done');
      }));
    });
  }));
}

/**
 * 从某专栏中移除一篇文章
 */
exports.removeTopic = function (req, res, next) {
  var ep = tools.createJsonEventProxy(res, next);
  if (!req.body.cid || !req.body.tid) {
    return ep.emit('fail', 403, '参数错误！');
  }
  var column_id = req.body.cid;
  var topic_id = req.body.tid;
  var user = req.session.user;
  if (!user.is_admin) {
    return ep.emit('fail', 403, '无权限');
  }
  Column.getColumnById(column_id, ep.done(function (column) {
    if (!column) {
      return ep.emit('fail', '此活动不存在或已被删除。');
    }
    TopicColumn.getTopicColumn(column_id, topic_id, function (err, item) {
      if (err || !column) {
        return ep.emit('fail', 403);
      }
      item.remove(function () {
        column.topic_count--;
        column.save(ep.done(function () {
          ep.emit('done');
        }));
      });
    });
  }));
}
