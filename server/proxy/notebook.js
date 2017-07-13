var Notebook = require('../models').Notebook;
var Topic = require('./topic');

/**
 * 获取用户所有文集
 */
exports.getNotebooksByUserId = function (user_id) {
  return Notebook.find({
      user: user_id
    })
    .sort('-create_at')
    .exec();
}

/**
 * 创建新的文集
 */
exports.createNotebook = function (notebook) {
  var notebook = new Notebook(notebook);
  return notebook.save();
}

/**
 * 删除文集
 */
exports.removeNotebook = function (id) {
  return Topic.removeTopicFromNotebook(id)
    .then(function (result) {
      return Notebook.findByIdAndRemove(id)
        .exec();
    })
}

/**
 * 修改文集名称
 */
exports.updateNotebook = function (id, name) {
  return Notebook.findByIdAndUpdate(id, {
      name: name
    })
    .exec();
}
