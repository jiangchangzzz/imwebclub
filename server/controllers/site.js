/*!
 * nodeclub - site index controller.
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * Copyright(c) 2012 muyuan
 * MIT Licensed
 */

var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Question = require('../proxy').Question;
var Activity = require('../proxy').Activity;
var Banner = require('../proxy').Banner;
var Column = require('../proxy').Column;
var UserFollow = require('../proxy').UserFollow;
var Message = require('../proxy').Message;
var SystemMessage=require('../proxy').SystemMessage;
var config = require('../config');
var eventproxy = require('eventproxy');
var cache = require('../common/cache');
// var xmlbuilder = require('xmlbuilder');
var dataAdapter = require('../common/dataAdapter');
var renderHelper = require('../common/render_helper');
var _ = require('lodash');
// var bannerMiddlewares = require('./server/middlewares/banners')

exports.index = function (req, res, next) {
  var tab = req.query.tab || 'all';
  var proxy = new eventproxy();
  proxy.fail(next);

  var options = {
    limit: 10,
    sort: '-top -visit_count'
  };

  // 取排行榜上的用户
  // cache.get('tops', proxy.done(function (tops) {
  //   if (tops) {
  //     proxy.emit('tops', tops);
  //   } else {
  User.getUsersByQuery({
      '$or': [{
        is_block: {
          '$exists': false
        }
      }, {
        is_block: false
      }]
    }, {
      limit: 10,
      sort: '-topic_count'
    },
    proxy.done('tops', function (tops) {
      cache.set('tops', tops, 60 * 1);
      return tops;
    })
  );
  //   }
  // }));
  // END 取排行榜上的用户

  //取文章
      Topic.getTopicsByQuery({
        'create_at': {
          $gte: new Date(new Date().getTime() - 60 * 60 * 24 * 14 * 1000).toISOString()
        },
        '$or': [{'$and':[{ good: 'true' },{ tab: 'special' }]},{ tab: { '$ne': 'special' } }]
      }, options, proxy.done('topics', function (topics) {
        var result = topics.map(function (item) {
          return dataAdapter.outTopic(item);
        });
        return result;
      }));

  //取问答
  cache.get('questions', proxy.done(function (questions) {
    if (questions) {
      proxy.emit('questions', questions);
    } else {
      Question.getQuestionsByQuery({}, options, proxy.done('questions', function (questions) {
        var result = questions.map(function (item) {
          return dataAdapter.outQuestion(item);
        });
        cache.set('questions', result, 60 * 1);
        return result;
      }));
    }
  }));

  //取活动
  cache.get('activity_imweb', proxy.done(function (imwebs) {
    if (imwebs) {
      proxy.emit('activity_imweb', imwebs);
    } else {
      Activity.getActivitiesByQuery({
          tab: 'imweb'
        }, {
          limit: 6,
          sort: '-create_at'
        },
        proxy.done('activity_imweb', function (imwebs) {
          var result = imwebs.map(function (item) {
            return dataAdapter.outActivity(item);
          });
          cache.set('activity_imweb', result, 60 * 1);
          return result;
        })
      )
    }
  }));

  cache.get('activity_industry', proxy.done(function (industrys) {
    if (industrys) {
      proxy.emit('activity_industry', industrys);
    } else {
      Activity.getActivitiesByQuery({
          tab: 'industry'
        }, {
          limit: 6,
          sort: '-create_at'
        },
        proxy.done('activity_industry', function (industrys) {
          var result = industrys.map(function (item) {
            return dataAdapter.outActivity(item);
          });
          cache.set('activity_industry', result, 60 * 1);
          return result;
        })
      )
    }
  }));

  cache.get('banners', proxy.done(function (banners) {
    if (banners) {
      proxy.emit('banners', banners);
    } else {
      Banner.activeBannersSortedByIndex(proxy.done('banners', function (banners) {
        cache.set('banners', banners, 60 * 1);
        return banners;
      }));
    }
  }));

  //获取主页专栏数据


  var options = {
    limit: 5,
    sort: '-follower_count -create_at'
  };
  Column.getColumnsByQuery({}, options, proxy.done(function (columns) {
    var res = columns.map(function (column) {
      return dataAdapter.outColumn(column);
    });
    proxy.emit('columns', columns);
  }));


  var tabName = renderHelper.tabName(tab);
  proxy.all('topics', 'questions', 'tops', 'activity_imweb', 'activity_industry', 'banners', 'columns', 'followColumns',
    function (topics, questions, tops, activity_imweb, activity_industry, banners, columns, followColumns) {
      res.render('index', {
        _layoutFile: false,
        topics: topics,
        questions: questions,
        tops: tops,
        activity_industry: activity_industry,
        activity_imweb: activity_imweb,
        tabs: config.tabs,
        tab: tab,
        banners: banners,
        columns: columns,
        followColumns: followColumns,
        pageTitle: tabName && (tabName + '版块')
      });
    });

  //获取当前用户关注的专栏
  var currentUser = req.session.user;
  if (currentUser) {
    var userId = currentUser._id;
    UserFollow.getUserFollowsByUserId(userId, 'column', {}, proxy.done('followColumns', function (followColumns) {
      return followColumns.map(function (item) {
        return item.object_id.toString();
      });
    }));
  } else {
    proxy.emit('followColumns', []);
  }
};

exports.latestTopics = function (req, res, next) {
  var proxy = new eventproxy();
  proxy.fail(next);

  var options = {
    limit: 10,
    sort: '-top -visit_count -create_at'
  };

  cache.get('topics', proxy.done(function (topics) {
    if (topics) {
      proxy.emit('topics', topics);
    } else {
      Topic.getTopicsByQuery({
        'create_at': {
          $gte: new Date(new Date().getTime() - 60 * 60 * 24 * 60 * 1000).toISOString()
        }
      }, options, proxy.done('topics', function (topics) {
        var result = topics.map(function (item) {
          return dataAdapter.outTopic(item);
        });
        cache.set('topics', result, 60 * 1);
        return result;
      }));
    }
  }));

  proxy.all('topics', function (topics) {
    res.end('callback(' + JSON.stringify(topics) + ')');
    return true;
  });
}

// exports.sitemap = function (req, res, next) {
//   var urlset = xmlbuilder.create('urlset',
//     { version: '1.0', encoding: 'UTF-8' });
//   urlset.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

//   var ep = new eventproxy();
//   ep.fail(next);

//   ep.all('sitemap', function (sitemap) {
//     res.type('xml');
//     res.send(sitemap);
//   });

//   cache.get('sitemap', ep.done(function (sitemapData) {
//     if (sitemapData) {
//       ep.emit('sitemap', sitemapData);
//     } else {
//       Topic.getLimit5w(function (err, topics) {
//         if (err) {
//           return next(err);
//         }
//         topics.forEach(function (topic) {
//           urlset.ele('url').ele('loc', 'http://cnodejs.org/topic/' + topic._id);
//         });

//         var sitemapData = urlset.end();
//         // 缓存一天
//         cache.set('sitemap', sitemapData, 3600 * 24);
//         ep.emit('sitemap', sitemapData);
//       });
//     }
//   }));
// };

// exports.appDownload = function (req, res, next) {
//   res.redirect('https://github.com/soliury/noder-react-native/blob/master/README.md')
// };
