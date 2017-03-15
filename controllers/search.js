// exports.index = function (req, res, next) {
//   var q = req.query.q;
//   q = encodeURIComponent(q);
//   res.redirect('https://www.google.com.hk/#hl=zh-CN&q=site:cnodejs.org+' + q);
// };
var eventproxy = require('eventproxy');
var cache = require('../common/cache');
var Topic = require('../proxy').Topic;
var config = require('../config');
var renderHelper = require('../common/render_helper');

exports.index = function(req, res, next) {
  var search = req.body.search;
   var page = parseInt(req.query.page, 10) || 1;
    page = page > 0 ? page : 1;
    var tab = req.params.tab || 'all';

    var proxy = new eventproxy();
    proxy.fail(next);

    // 取主题
    var query = {};
    if(search){
    query.title = new RegExp(search,'i');
    }
    if (tab && tab !== 'all') {
        if (tab === 'good') {
            query.good = true;
        } else {
            query.tab = tab;
        }
    }

    var limit = config.list_topic_count;
    var options = {
        skip: (page - 1) * limit,
        limit: limit,
        sort: '-top -last_reply_at'
    };
    var optionsStr = JSON.stringify(query) + JSON.stringify(options);
    cache.get(optionsStr, proxy.done(function(topics) {
        if (topics) {
            return proxy.emit('topics', topics);
        }
        Topic.getTopicsByQuery(query, options, proxy.done('topics', function(topics) {
            return topics;
        }));
    }));
    // END 取主题

    // 取分页数据
    cache.get('pages', proxy.done(function(pages) {
        if (pages) {
            proxy.emit('pages', pages);
        } else {
            Topic.getCountByQuery(query, proxy.done(function(all_topics_count) {
                var pages = Math.ceil(all_topics_count / limit);
                cache.set(JSON.stringify(query) + 'pages', pages, 1000 * 60 * 1);
                proxy.emit('pages', pages);
            }));
        }
    }));

    // topic类型过滤器
    var topicFormat = function(topics) {
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

    var tabName = renderHelper.tabName(tab);
    // if (!tabName) {
        proxy.all('topics', 'pages'/**'tops', 'no_reply_topics', 'pages', 'topic_caculate','issues'**/,
            function(topics, pages /**tops, no_reply_topics, pages, topic_caculate, issues**/) {
                res.render('topic/list', {
                    topics: topicFormat(topics),
                    current_page: page,
                    base: '/',
                    list_topic_count: limit,
                    // tops: tops,
                    showSignIn: true,
                    // no_reply_topics: no_reply_topics,
                    pages: pages,
                    tabs: config.tabs,
                    tab: tab,
                    // issues: issues,
                    // topic_caculate: topic_caculate,
                    pageTitle: tabName && (tabName + '版块')
                });
            });
    // } else {
        // proxy.all('topics',  'pages',/**'tops', 'no_reply_topics', 'pages', 'topic_caculate', 'issues'**/,
        //     function(topics, pages/**tops, no_reply_topics, pages, topic_caculate, issues**/) {

        //         res.render('topic/list', {
        //             topics: topicFormat(topics),
        //             current_page: page,
        //             base: '/',
        //             list_topic_count: limit,
        //             // tops: tops,
        //             showSignIn: true,
        //             // no_reply_topics: no_reply_topics,
        //             pages: pages,
        //             tabs: config.tabs,
        //             tab: tab,
        //             // issues: issues,
        //             // topic_caculate: topic_caculate,
        //             pageTitle: tabName && (tabName + '版块')
        //         });
        //     });
    // }
}
