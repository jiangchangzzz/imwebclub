var models = require('../models');
var Evernote = models.Evernote;

/**
 * 获取现有的evernote用户总数
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
    Evernote.count(query, callback);
};


/**
 * 根据用户ID，查找所有笔记
 * @param {String} id 用户id
 * @param {Function} callback 回调函数
 */
exports.getNotebooks = function (id, callback) {
    Evernote.findOne({author_id: id}, callback);
};


exports.save = function (id, notebooks, callback) {
    Evernote.findOne({author_id:id},function(err, evernote){
        if (!evernote){
            evernote = new Evernote(); 
            evernote.author_id = id;
        }

        evernote.notebooks = notebooks;
        evernote.update_at = new Date();
        evernote.save(callback);
    });
};
