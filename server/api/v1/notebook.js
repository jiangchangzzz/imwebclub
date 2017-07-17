var Promise = require('bluebird');
var validator = require('validator');
var Notebook = require('../../proxy').Notebook;
var User = require('../../proxy').User;

/**
 * 获取用户所有文集
 */
exports.getNotebook = function (req, res, next) {
  var userId = req.query.userid;

  //参数校验
  if (userId && !validator.isMongoId(userId)) {
    res.status(400);
    return res.send({
      success: false,
      error_msg: '不是有效的用户id'
    });
  }

  //操作数据库
  Notebook.getNotebooksByUserId(userId)
    .then(function (notebooks) {
      return res.send({
        success: true,
        data: notebooks
      })
    }).catch(next);
}

//创建新的文集
exports.postNotebook = function (req, res, next) {
  var userId = req.body.userId;
  var name = req.body.name;

  //参数校验
  if (!validator.isMongoId(userId)) {
    res.status(400);
    return res.send({
      success: false,
      error_msg: '不是有效的用户id'
    });
  }

  var name = validator.trim(name);
  if (name === '') {
    res.status(400);
    return res.send({
      success: false,
      error_msg: '文集名称不能为空'
    });
  }

  //操作数据库
  Notebook.createNotebook({
    name: name,
    user: userId
  }).then(function (result) {
    return res.send({
      success: true,
      data: result
    });
  }).catch(function(err){
    console.log(err);
  });
}

//更新文集
exports.putNotebook = function (req, res, next) {
  var id = req.params.id;
  var name = req.body.name;

  //参数校验
  if (!validator.isMongoId(id)) {
    res.status(400);
    return res.send({
      success: false,
      error_msg: '不是有效的文集id'
    });
  }

  var name = validator.trim(name);
  if (name === '') {
    res.status(400);
    return res.send({
      success: false,
      error_msg: '文集名称不能为空'
    });
  }

  //操作数据库
  Notebook.updateNotebook(id, name)
    .then(function () {
      return Notebook.getNotebookById(id);
    })
    .then(function(result){
      return res.send({
        success: true,
        data: result
      });
    })
    .catch(next);
};

//删除文集
exports.deleteNotebook = function (req, res, next) {
  var id = req.params.id;

  //参数校验
  if (!validator.isMongoId(id)) {
    res.status(400);
    return res.send({
      success: false,
      error_msg: '不是有效的文集id'
    });
  }

  //操作数据库
  Notebook.removeNotebook(id)
    .then(function(result){
        return res.send({
            success: true,
            data: result
        });
    }).catch(next);
};
