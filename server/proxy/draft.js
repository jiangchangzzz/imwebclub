var models = require('../models');
var Draft = models.Draft;

/**
 * 根据id获取draft
 * @param {String} id
 * @param {Function} callback 回调函数
 * Callback:
 * - err, 数据库错误
 * - obj, draft
 */
exports.findById = function(id, callback) {
    Draft.findOne({_id: id}, callback);
};

/**
 * 获取一个新的草稿
 * @param {String} author_id author id
 * @param {?String} topic_id 文章id，修改文章时存在
 * @param {Function} callback 回调函数
 * Callback:
 * - err, 数据库错误
 * - obj, draft
 */
exports.newAndSave = function(author_id, topic_id, callback) {
    var obj = new Draft();
    obj.author_id = author_id;
    obj.topic_id = topic_id || null;
    obj.save(callback);
};

/**
 * 查询用户草稿数
 */
exports.countAuthorDraft = function(authorId, callback) {
    Draft.find({
        author_id: authorId
    })
    .count(callback);
};

/**
 * 查询用户某个时间前的草稿
 */
exports.queryAuthorDraft = function(authorId, beforeTime, limit, callback) {
    Draft.find({
        author_id: authorId,
        create_at: {
            $lt: beforeTime
        }
    })
    .sort('-create_at')
    .limit(limit)
    .exec(callback);
};
