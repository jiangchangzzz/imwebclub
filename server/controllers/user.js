var User         = require('../proxy').User;
var Topic        = require('../proxy').Topic;
var Reply        = require('../proxy').Reply;
var Question     = require('../proxy').Question;
var UserCollect = require('../proxy').UserCollect;
var utility      = require('utility');
var util         = require('util');
var TopicModel   = require('../models').Topic;
var ReplyModel   = require('../models').Reply;
var tools        = require('../common/tools');
var config       = require('../config');
var EventProxy   = require('eventproxy');
var validator    = require('validator');
var _            = require('lodash');

exports.index = function (req, res, next) {
  var user_name = req.params.name;
  User.getUserByLoginName(user_name, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.render404('这个用户不存在。');
      return;
    }

    var render = function (recent_topics, recent_replies) {
      user.url = (function () {
        if (user.url && user.url.indexOf('http') !== 0) {
          return 'http://' + user.url;
        }
        return user.url;
      })();
      // 如果用户没有激活，那么管理员可以帮忙激活
      var token = '';
      if (!user.active && req.session.user && req.session.user.is_admin) {
        token = utility.md5(user.email + user.pass + config.session_secret);
      }
      res.render('user/index', {
        user: user,
        currentUser: req.session.user,
        recent_topics: recent_topics,
        recent_replies: recent_replies,
        token: token,
        pageTitle: util.format('@%s 的个人主页', user.loginname),
        tab: 'index'
      });
    };

    var proxy = new EventProxy();
    proxy.assign('recent_topics', 'recent_replies', render);
    proxy.fail(next);

    var query = {author_id: user._id};
    var opt = {limit: 5, sort: '-create_at'};
    Topic.getTopicsByQuery(query, opt, proxy.done('recent_topics'));

    Reply.getRepliesByAuthorId(user._id, 'topic', {limit: 20, sort: '-create_at'},
      proxy.done(function (replies) {

        var topic_ids = replies.map(function (reply) {
          return reply.topic_id.toString();
        })
        topic_ids = _.uniq(topic_ids).slice(0, 5); //  只显示最近5条
        var query = {_id: {'$in': topic_ids}};
        var opt = {};
        Topic.getTopicsByQuery(query, opt, proxy.done('recent_replies', function (recent_replies) {
          recent_replies = _.sortBy(recent_replies, function (topic) {
            return topic_ids.indexOf(topic._id.toString())
          })
          return recent_replies;
        }));
      }));
  });
};

exports.listStars = function (req, res, next) {
  User.getUsersByQuery({is_star: true}, {}, function (err, stars) {
    if (err) {
      return next(err);
    }
    res.render('user/stars', {stars: stars, currentUser: req.session.user});
  });
};

exports.showSetting = function (req, res, next) {
  User.getUserById(req.session.user._id, function (err, user) {
    if (err) {
      return next(err);
    }
    if (req.query.save === 'success') {
      user.success = '保存成功。';
    }
    user.error = null;
    return res.render('user/setting', {user: user, currentUser: req.session.user, tab: 'seeting'});
  });
};

exports.showPassword = function (req, res, next) {
  User.getUserById(req.session.user._id, function (err, user) {
    if (err) {
      return next(err);
    }
    if (req.query.save === 'success') {
      user.success = '保存成功。';
    }
    user.error = null;
    return res.render('user/password', {user: user, currentUser: req.session.user});
  });
};

exports.showFollowing = function (req, res, next) {
  var user_name = req.params.name;
  User.getUserByLoginName(user_name, function (err, user) {
  // User.getUserById(req.session.user._id, function (err, user) {
    if (err) {
      return next(err);
    }
    if (req.query.save === 'success') {
      user.success = '保存成功。';
    }
    user.error = null;
    var ep = new EventProxy();
    ep.all('following', function(followUser) {
      return res.render('user/follow', { user: user, followUser: followUser, currentUser: req.session.user, tab: 'follwing'});
    })
    User.getFollowUser(user.following , ep.done('following'));
  });
};

exports.showFollower = function (req, res, next) {
  var user_name = req.params.name;
  User.getUserByLoginName(user_name, function (err, user) {
  // User.getUserById(req.session.user._id, function (err, user) {
    if (err) {
      return next(err);
    }

    user.error = null;
    var ep = new EventProxy();
    ep.all('follower', function(follower) {
      return res.render('user/follow', { user: user, follower: follower, currentUser: req.session.user, tab: 'follower'});
    })
    User.getFollowUser(user.follower , ep.done('follower'));
  });
};

exports.setting = function (req, res, next) {
  var ep = new EventProxy();
  ep.fail(next);

  // 显示出错或成功信息
  function showMessage(msg, data, isSuccess) {
    data = data || req.body;
    var data2 = {
      loginname: data.loginname,
      email: data.email,
      url: data.url,
      location: data.location,
      avatar: data.avatar,
      signature: data.signature,
      weibo: data.weibo,
      accessToken: data.accessToken,
    };
    if (isSuccess) {
      data2.success = msg;
    } else {
      data2.error = msg;
    }
    res.render('user/setting', {user: data2, currentUser: req.session.user, tab: 'setting'});
  }

  // post
  var action = req.body.action;
  if (action === 'change_setting') {
    var url = validator.trim(req.body.url);
    var location = validator.trim(req.body.location);
    var weibo = validator.trim(req.body.weibo);
    var signature = validator.trim(req.body.signature);
    var avatar = validator.trim(req.body.avatar);

    User.getUserById(req.session.user._id, ep.done(function (user) {
      user.url = url;
      user.location = location;
      user.signature = signature;
      user.weibo = weibo;
      user.avatar = avatar;
      user.save(function (err) {
        if (err) {
          return next(err);
        }
        req.session.user = user.toObject({virtual: true});
        return res.render('user/setting', {user: user, currentUser: req.session.user,  tab: 'setting'});
      });
    }));
  }
  if (action === 'change_password') {
    var old_pass = validator.trim(req.body.old_pass);
    var new_pass = validator.trim(req.body.new_pass);
    if (!old_pass || !new_pass) {
      return res.send('旧密码或新密码不得为空');
    }

    User.getUserById(req.session.user._id, ep.done(function (user) {
      tools.bcompare(old_pass, user.pass, ep.done(function (bool) {
        if (!bool) {
          return showMessage('当前密码不正确。', user);
        }

        tools.bhash(new_pass, ep.done(function (passhash) {
          user.pass = passhash;
          user.save(function (err) {
            if (err) {
              return next(err);
            }
            return showMessage('密码已被修改。', user, true);

          });
        }));
      }));
    }));
  }
};

exports.addFollowUser = function(req, res, next) {
  var user_id = req.session.user.id;
  var followUser_id = req.body.followUser_id;

  var proxy = EventProxy.create('following', 'follower', function(){
      res.send({ status: 'success' });
  });
  proxy.fail(next);
  function addUser(user_id, followUser_id, field){
    User.getUserById(user_id, proxy.done(field, function(user) {
      if(!user) {
        return next(new Error('user is not exists'));
      }
      const index = user[field].findIndex((id) => (id === followUser_id));
      if(index === -1) {
        user[field].push(followUser_id);
        user[field+'_count'] ++;
      }
      user.save();
    }))
  }
  addUser(user_id, followUser_id,'following');
  addUser(followUser_id, user_id,'follower');
}

exports.deleteFollowUser = function(req, res, next) {
  var user_id = req.session.user.id;
  var followUser_id = req.body.followUser_id;

  var proxy = EventProxy.create('following', 'follower', function(){
      res.send({ status: 'success' });
  });
  proxy.fail(next);
  function deleteUser(user_id, followUser_id, field){
    User.getUserById(user_id, proxy.done(field, function(user) {
      if(!user) {
        return next(new Error('user is not exists'));
      }
      const index = user[field].findIndex((id) => (id === followUser_id));
      if(index !== -1) {
        user[field].splice(index, 1);
        user[field+'_count'] --;
      }
      user.save();
    }))
  }
  deleteUser(user_id, followUser_id,'following');
  deleteUser(followUser_id, user_id,'follower');
}

exports.toggleStar = function (req, res, next) {
  var user_id = req.body.user_id;
  User.getUserById(user_id, function (err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error('user is not exists'));
    }
    user.is_star = !user.is_star;
    user.save(function (err) {
      if (err) {
        return next(err);
      }
      res.json({ status: 'success' });
    });
  });
};

exports.listCollectedTopics = function (req, res, next) {
  var name = req.params.name;
  var page = Number(req.query.page) || 1;
  var limit = config.list_topic_count;

  User.getUserByLoginName(name, function (err, user) {
    if (err || !user) {
      return next(err);
    }

    var render = function (topics, pages) {
      res.render('user/collect_topics', {
        topics: topics,
        current_page: page,
        pages: pages,
        user: user,
        currentUser: req.session.user
      });
    };

    var proxy = EventProxy.create('topics', 'pages', render);
    proxy.fail(next);

    var opt = {
      skip: (page - 1) * limit,
      limit: limit,
    };

    UserCollect.getUserCollectsByUserId(user._id, 'topic', opt, proxy.done(function (docs) {
      var ids = docs.map(function (doc) {
        return String(doc.topic_id)
      })
      var query = { _id: { '$in': ids } };

      Topic.getTopicsByQuery(query, {}, proxy.done('topics', function (topics) {
        topics = _.sortBy(topics, function (topic) {
          return ids.indexOf(String(topic._id))
        })
        return topics
      }));
      Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
        var pages = Math.ceil(all_topics_count / limit);
        proxy.emit('pages', pages);
      }));
    }));
  });
};

exports.top100 = function (req, res, next) {
  var opt = {limit: 100, sort: '-score'};
  User.getUsersByQuery({is_block: false}, opt, function (err, tops) {
    if (err) {
      return next(err);
    }
    res.render('user/top100', {
      users: tops,
      pageTitle: 'top100',
      currentUser: req.session.user
    });
  });
};

exports.listTopics = function (req, res, next) {
  var user_name = req.params.name;
  var page = Number(req.query.page) || 1;
  var limit = config.list_topic_count;

  User.getUserByLoginName(user_name, function (err, user) {
    if (!user) {
      res.render404('这个用户不存在。');
      return;
    }

    var render = function (topics, pages) {
      res.render('user/topics', {
        user: user,
        recent_topics: topics,
        current_page: page,
        pages: pages,
        currentUser: req.session.user,
        base: '/user/' + user_name + '/topics',
        tab: 'topics'
      });
    };

    var proxy = new EventProxy();
    proxy.assign('topics', 'pages', render);
    proxy.fail(next);

    var query = {'author_id': user._id};
    var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    Topic.getTopicsByQuery(query, opt, proxy.done('topics'));

    Topic.getCountByQuery(query, proxy.done(function (all_topics_count) {
      var pages = Math.ceil(all_topics_count / limit);
      proxy.emit('pages', pages);
    }));
  });
};

exports.listQuestions = function(req, res, next) {
  var user_name = req.params.name;
  var page = Number(req.query.page) || 1;
  var limit = config.list_topic_count;

  User.getUserByLoginName(user_name, function (err, user) {
    if (!user) {
      res.render404('这个用户不存在。');
      return;
    }

    var render = function (questions, pages) {
      res.render('user/questions', {
        user: user,
        questions: questions,
        current_page: page,
        pages: pages,
        currentUser: req.session.user,
        base: '/user/' + user_name + '/questions',
        tab: 'questions'
      });
    };

    var proxy = new EventProxy();
    proxy.assign('questions', 'pages', render);
    proxy.fail(next);

    var query = {'author_id': user._id};
    var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    Question.getQuestionsByQuery(query, opt, proxy.done('questions'));

    Question.getCountByQuery(query, proxy.done(function (all_topics_count) {
      var pages = Math.ceil(all_topics_count / limit);
      proxy.emit('pages', pages);
    }));
  });
}

exports.listReplies = function (req, res, next) {
  var user_name = req.params.name;
  var page = Number(req.query.page) || 1;
  var limit = 50;

  User.getUserByLoginName(user_name, function (err, user) {
    if (!user) {
      res.render404('这个用户不存在。');
      return;
    }

    var render = function (recent_replies, pages) {
      res.render('user/replies', {
        user: user,
        recent_replies: recent_replies,
        current_page: page,
        pages: pages,
        currentUser: req.session.user,
        tab: 'replies'
      });
    };

    var proxy = new EventProxy();
    proxy.assign('recent_replies', 'pages', render);
    proxy.fail(next);

    var opt = {skip: (page - 1) * limit, limit: limit, sort: '-create_at'};
    Reply.getRepliesByAuthorId(user._id, 'topic', opt, proxy.done(function (replies) {
      // 获取所有有评论的主题
      var topic_ids = replies.map(function (reply) {
        return reply.topic_id.toString();
      });
      topic_ids = _.uniq(topic_ids);

      var query = {'_id': {'$in': topic_ids}};
      Topic.getTopicsByQuery(query, {}, proxy.done('topics', function (topics) {
        topics = _.sortBy(topics, function (topic) {
          return topic_ids.indexOf(topic._id.toString())
        })
        return topics;
      }));
    }));
    Reply.getRepliesByAuthorId(user._id, 'topic', opt,
      proxy.done(function (replies) {

        var topic_ids = replies.map(function (reply) {
          return reply.parent_id ? reply.parent_id.toString() : reply.topic_id.toString()
        })
        topic_ids = _.uniq(topic_ids); 

        var query = {_id: {'$in': topic_ids}};
        var opt = {};
        Topic.getTopicsByQuery(query, opt, proxy.done('recent_replies', function (recent_replies) {
          recent_replies = _.sortBy(recent_replies, function (topic) {
            return topic_ids.indexOf(topic._id.toString())
          })
          return recent_replies;
        }));
      }));

    Reply.getCountByAuthorId(user._id, 'topic', proxy.done('pages', function (count) {
      var pages = Math.ceil(count / limit);
      return pages;
    }));
  });
};

exports.block = function (req, res, next) {
  var loginname = req.params.name;
  var action = req.body.action;

  var ep = EventProxy.create();
  ep.fail(next);

  User.getUserByLoginName(loginname, ep.done(function (user) {
    if (!user) {
      return next(new Error('user is not exists'));
    }
    if (action === 'set_block') {
      ep.all('block_user',
        function (user) {
          res.json({status: 'success'});
        });
      user.is_block = true;
      user.save(ep.done('block_user'));

    } else if (action === 'cancel_block') {
      user.is_block = false;
      user.save(ep.done(function () {

        res.json({status: 'success'});
      }));
    }
  }));
};

exports.deleteAll = function (req, res, next) {
  var loginname = req.params.name;

  var ep = EventProxy.create();
  ep.fail(next);

  User.getUserByLoginName(loginname, ep.done(function (user) {
    if (!user) {
      return next(new Error('user is not exists'));
    }
    ep.all('del_topics', 'del_replys', 'del_ups',
      function () {
        res.json({status: 'success'});
      });
    // 删除主题
    TopicModel.update({author_id: user._id}, {$set: {deleted: true}}, {multi: true}, ep.done('del_topics'));
    // 删除评论
    ReplyModel.update({author_id: user._id}, {$set: {deleted: true}}, {multi: true}, ep.done('del_replys'));
    // 点赞数也全部干掉
    ReplyModel.update({}, {$pull: {'ups': user._id}}, {multi: true}, ep.done('del_ups'));
  }));
};
