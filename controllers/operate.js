var User = require('../proxy').User;
var Topic = require('../proxy').Topic;
var Question = require('../proxy').Question;
var Activity = require('../proxy').Activity;
var UserCollect = require('../proxy').UserCollect;
var EventProxy = require('eventproxy');
var tools = require('../common/tools');
var store = require('../common/store');
var config = require('../config');
var _ = require('lodash');
var cache = require('../common/cache');
var logger = require('../common/logger');

var ObjectDict = {
    'topic': Topic.getTopicById,
    'question': Question.getQuestionById,
    'activity': Activity.getActivityById,
};

// 设为置顶
exports.top = function(req, res, next) {
    var object_id = req.body.object_id;
    var kind = req.params.kind.toLowerCase();

    if (!ObjectDict.hasOwnProperty(kind) || !object_id) {
        res.send({
            ret: 1,
            msg: '参数不合法。'
        });
        return;
    }
    ObjectDict[kind](object_id, function(err, object) {
        if (err) {
            return res.send({
                ret: 1
            });
        }
        if (err || !object) {
            res.send({
                ret: 1,
                msg: '此对象不存在或已被删除。'
            });
            return;
        }
        object.top = !object.top;
        object.save(function(err) {
            if (err) {
                return res.send({
                    ret: 1
                });
            }
            res.send({
                ret: 0,
                data: {
                    top: object.top
                }
            });
        });
    });
};

// 设为精华
exports.good = function(req, res, next) {
    var object_id = req.body.object_id;
    var kind = req.params.kind.toLowerCase();

    if (!ObjectDict.hasOwnProperty(kind) || !object_id) {
        res.send({
            ret: 1,
            msg: '参数不合法。'
        });
        return;
    }

    ObjectDict[kind](object_id, function(err, object) {
        if (err) {
            return res.send({
                ret: 1
            });
        }
        if (err || !object) {
            res.send({
                ret: 1,
                msg: '此对象不存在或已被删除。'
            });
            return;
        }
        object.good = !object.good;
        object.save(function(err) {
            if (err) {
                return res.send({
                    ret: 1
                });
            }
            var msg = object.good ? '此话题已加精。' : '此话题已取消加精。';
            res.render('notify/notify', {
                success: msg,
                referer: referer
            });
        });
    });
};

// 锁定主题，不可再回复
exports.lock = function(req, res, next) {
    var topicId = req.params.tid;
    var kind = req.params.kind.toLowerCase();

    if (!ObjectDict.hasOwnProperty(kind) || !object_id) {
        res.send({
            ret: 1,
            msg: '参数不合法。'
        });
        return;
    }

    ObjectDict[kind](topicId, function(err, topic) {
        if (err) {
            return res.send({
                ret: 1
            });
        }
        if (!topic) {
            res.render404('此d不存在或已被删除。');
            return;
        }
        topic.lock = !topic.lock;
        topic.save(function(err) {
            if (err) {
                return res.send({
                    ret: 1
                });
            }
            res.send({
                ret: 0,
                data: {
                    lock: object.lock
                }
            });
        });
    });
};

// 收藏主题
exports.collect = function(req, res, next) {
    var object_id = req.body.object_id;
    var kind = req.body.kind.toLowerCase();

    var proxy = EventProxy.create();
    proxy.fail(next);
    proxy.on('fail', function() {
        res.send({
            ret: 1
        });
    });

    if (!ObjectDict.hasOwnProperty(kind) || !object_id) {
        return proxy.emit('fail');
    }
    ObjectDict[kind](object_id, proxy.done(function(object) {
        if (!object) {
            return proxy.emit('fail');
        }
        return proxy.emit('object', object);
    }));

    User.getUserById(req.session.user._id, proxy.done(function(user) {
        if (!user) {
            return proxy.emit('fail');
        }
        return proxy.emit('user', user);
    }));
    proxy.all('object', 'user', function(object, user) {
        UserCollect.getUserCollect(user._id, object._id, proxy.done(function(item) {
            if (item) {
                item.remove(function(){
                  proxy.emit('collect', false)
                });
            } else {
                UserCollect.newAndSave(user._id, object._id, kind, function(){
                  proxy.emit('collect', true);
                });
            }
        }));
    });

    proxy.all('object', 'user', 'collect', function(object, user) {
        UserCollect.getObjectCollectCount(object._id, proxy.done(function(count) {
            object.collect_count = count;
            object.save(function(){
              proxy.emit('object_updated', count);
            });
        }));
        UserCollect.getUserCollectCount(user._id, kind, proxy.done(function(count) {
            user['collect_' + kind + '_count'] = count;
            user.save(function(){
              proxy.emit('user_updated', count);
            });
        }));
    });

    proxy.all('collect', 'object_updated', 'user_updated', function(if_collect, collect_count, user_collect_count) {
        res.send({
            ret: 0,
            data: {
                kind: kind,
                ifCollect: if_collect,
                objectCollectCount: collect_count,
                userCollectCount: user_collect_count
            }
        });
    });
};

exports.upload = function(req, res, next) {
    var isFileLimit = false;
    req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        file.on('limit', function() {
            isFileLimit = true;

            res.json({
                success: false,
                msg: 'File size too large. Max is ' + config.file_limit
            })
        });

        store.upload(file, {
            filename: filename
        }, function(err, result) {
            if (err) {
                return res.send({
                    ret: 1
                });
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
