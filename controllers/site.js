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
var config = require('../config');
var eventproxy = require('eventproxy');
var cache = require('../common/cache');
var xmlbuilder = require('xmlbuilder');
var dataAdapter = require('../common/dataAdapter');
var renderHelper = require('../common/render_helper');
var _ = require('lodash');

exports.index = function (req, res, next) {
  var page = parseInt(req.query.page, 10) || 1;
  page = page > 0 ? page : 1;
  var tab = req.query.tab || 'all';

  var proxy = new eventproxy();
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

  var limit = config.list_hot_topic_count;
  var options = { skip: (page - 1) * limit, limit: limit, sort: '-top -reply_count -create_at' };

  Topic.getTopicsByQuery(query, options, proxy.done('topics', function (topics) {
    return topics;
  }));

  Question.getQuestionsByQuery({}, options, proxy.done('questions', function (questions) {
    return questions.map(function(item){
      return dataAdapter.outQuestion(item);
    });
  }));

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

  //取活动
  cache.get('activity_imweb', proxy.done(function(imwebs) {
    if (imwebs) {
      proxy.emit('activity_imweb', imwebs);
    } else {
      Activity.getActivitiesByQuery(
        { tab: 'imweb' },
        { limit: 6, sort: '-create_at' },
        proxy.done('activity_imweb', function (imwebs) {
          cache.set('activity_imweb', imwebs, 60 * 1);
          return imwebs;
        })
      )
    }
  }));

  cache.get('activity_industry', proxy.done(function(industrys) {
    if (industrys) {
     proxy.emit('activity_industry', industrys); 
    } else {
      Activity.getActivitiesByQuery(
        { tab: 'industry' },
        { limit: 6, sort: '-create_at' },
        proxy.done('activity_industry', function (industrys) {
          cache.set('activity_industry', industrys, 60 * 1);
          return industrys;
        })
      )
    }
  }))

  var tabName = renderHelper.tabName(tab);
  proxy.all('topics', 'questions', 'tops', 'activity_imweb', 'activity_industry',
    function (topics, questions, tops, activity_imweb, activity_industry) {
      res.render('index', {
        topics: topics,
        questions: questions,
        current_page: page,
        list_topic_count: limit,
        tops: tops,
        activity_industry: activity_industry,
        activity_imweb: activity_imweb,
        tabs: config.tabs,
        tab: tab,
        pageTitle: tabName && (tabName + '版块')
      });
    });
};

exports.sitemap = function (req, res, next) {
  var urlset = xmlbuilder.create('urlset',
    { version: '1.0', encoding: 'UTF-8' });
  urlset.att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

  var ep = new eventproxy();
  ep.fail(next);

  ep.all('sitemap', function (sitemap) {
    res.type('xml');
    res.send(sitemap);
  });

  cache.get('sitemap', ep.done(function (sitemapData) {
    if (sitemapData) {
      ep.emit('sitemap', sitemapData);
    } else {
      Topic.getLimit5w(function (err, topics) {
        if (err) {
          return next(err);
        }
        topics.forEach(function (topic) {
          urlset.ele('url').ele('loc', 'http://cnodejs.org/topic/' + topic._id);
        });

        var sitemapData = urlset.end();
        // 缓存一天
        cache.set('sitemap', sitemapData, 3600 * 24);
        ep.emit('sitemap', sitemapData);
      });
    }
  }));
};

// exports.appDownload = function (req, res, next) {
//   res.redirect('https://github.com/soliury/noder-react-native/blob/master/README.md')
// };
