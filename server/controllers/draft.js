var _ = require('lodash');
var eventproxy = require('eventproxy');
var tools = require('../common/tools');
var dataAdapter = require('../common/dataAdapter');
var Draft = require('../proxy').Draft;
var Topic = require('../proxy').Topic;
var config = require('../config'); 

/**
 * 自动保存草稿
 */
exports.autosave = function(req, res, next) {
    var draft_id = req.body.draft_id || null;
    var topic_id = req.body.topic_id || null;
    var tab = req.body.tab;
    var title = req.body.title || '';
    var content = req.body.content || '';

    var ep = tools.createJsonEventProxy(res, next); 
    var topicObj = null;
    if (draft_id) {
        Draft.findById(draft_id, ep.done(function(draft) {
            if (!draft) {
                return ep.emit('createdraft');
            }
            ep.emit('draft', draft);
        }));
    } else {
        ep.emitLater('createdraft');
    }
    ep.on('createdraft', function() {
        if (topic_id) {
            Topic.getTopicById(topic_id, ep.done(function(topic) {
                if (!topic) {
                    return ep.emit('fail');
                }
                topicObj = topic;
                Draft.newAndSave(req.session.user._id, topic_id, ep.done('draft'));
            }));
        } else {
            Draft.newAndSave(req.session.user._id, null, ep.done('draft'));
        }
    });

    ep.all('draft', function(draft) {
        draft.tab = tab;
        draft.title = title;
        draft.content = content;
        draft.update_at = Date.now();
        draft.save(ep.done(function() {
            if (topicObj) {
                topicObj.draft = draft._id;
                topicObj.save(ep.done('saved'));
            } else {
                ep.emit('saved');
            }
        }));
    });

    ep.all('draft', 'saved', function(draft) {
        Draft.countAuthorDraft(req.session.user._id, ep.done(function(count) {
            ep.emit('done', {
                data: dataAdapter.outDraft(draft, {
                    content: true
                }),
                count: count
            });
        })); 
    });
};

/**
 * 查询用户草稿数
 */
exports.countmy = function(req, res, next) {
    var ep = tools.createJsonEventProxy(res, next); 
    Draft.countAuthorDraft(req.session.user._id, ep.done(function(count) {
        ep.emit('done', {
            count: count
        });
    })); 
};

/**
 * 查询用户的草稿
 */
exports.listmy = function(req, res, next) {
    var userId = req.session.user._id;
    var limit = req.query.limit ? +req.query.limit : 100;
    if (limit < 0 || limit > 1000) {
        limit = 100;
    }
    var beforeTime = req.query.beforeTime || Date.now();
    var ep = tools.createJsonEventProxy(res, next); 
    Draft.queryAuthorDraft(userId, beforeTime, limit, ep.done(function(list) {
        Draft.countAuthorDraft(req.session.user._id, ep.done(function(count) {
            list = _.map(list, function(item) {
                return dataAdapter.outDraft(item);
            });
            ep.emit('done', {
                data: list,
                count: count
            });
        })); 
    }));
};

/**
 * 查询草稿
 */
exports.get = function(req, res, next) {
    var id = req.params.id;
    var ep = tools.createJsonEventProxy(res, next); 
    Draft.findById(id, ep.done(function(item) {
        if (!item || !tools.idEqual(item.author_id, req.session.user._id)) {
            return ep.emit('fail');
        }
        ep.emit('done', {
            data: dataAdapter.outDraft(item, {
                content: true
            })
        });
    }));
};

/**
 * 删除草稿
 */
exports.delete = function(req, res, next) {
    var id = req.params.id;
    var ep = tools.createJsonEventProxy(res, next); 
    Draft.findById(id, ep.done(function(item) {
        if (!item || !tools.idEqual(item.author_id, req.session.user._id)) {
            return ep.emit('fail');
        }
        item.remove(ep.done('deleted'));
    }));
    ep.all('deleted', function(item) {
        var topic_id = item.topic_id;
        if (topic_id) {
            Topic.getTopicById(topic_id, ep.done(function(topic) {
                if (!topic) {
                    return ep.emit('topic_updated');
                }
                topic.draft = null;
                topic.save(ep.done('topic_updated'));
            }));
        } else {
            ep.emit('topic_updated');
        }
    });
    ep.all('topic_updated', function() {
        Draft.countAuthorDraft(req.session.user._id, ep.done(function(count) {
            ep.emit('done', {
                count: count
            });
        })); 
    });
};
