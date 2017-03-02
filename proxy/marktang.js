var models = require('../models');
var Marktang = models.Marktang;

/**
 * 获取现有的evernote用户总数
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 * @param {Function} callback 回调函数
 */
exports.getCountByQuery = function (query, callback) {
    Marktang.count(query, callback);
};


/**
 * 根据用户ID，查找所有笔记
 * @param {String} id 用户id
 * @param {Function} callback 回调函数
 */
exports.getNotebooks = function (id, callback) {
    Marktang.findOne({_id: id}, callback);
};

//get recently one
exports.getRecently = function (author_id, callback) {
    Marktang.findOne({author_id: author_id},{},{sort:{update_at:-1}},callback);
    //Marktang.find({author_id: author_id},{update_at:1,title:1},{sort:{update_at:-1},limit:1},callback);
};

exports.save = function ( note, callback) {
    
    Marktang.findOne({_id: note.id}, function(err, marktang){
        if (!marktang){
            marktang = new Marktang(); 
            marktang.author_id = note.author_id;
        }

        marktang.content = note.content;
        marktang.html = note.html;
        marktang.title = note.title;
        marktang.update_at = new Date();
        marktang.guid = note.guid;
        marktang.noteid = note.noteid;

        marktang.save(callback);
    });
};
