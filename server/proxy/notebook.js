var Notebook=require('../models').Notebook;

/**
 * 获取用户所有文集
 */
exports.getNotebooksByUserId=function(user_id){
    return Notebook.find({user: user_id})
        .exec();
}

/**
 * 创建新的文集
 */
exports.createNotebook=function(notebook){
    var notebook=new Notebook(notebook);
    return notebook.save()
        .exec();
}

/**
 * 删除文集
 */
exports.removeNotebook=function(id){
    return Notebook.findByIdAndRemove(id)
        .exec();
}

/**
 * 修改文集名称
 */
exports.updateNotebook=function(id, name){
    return Notebook.findByIdAndUpdate(id,{name: name})
        .exec();
}

