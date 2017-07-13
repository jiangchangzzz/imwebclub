var mongoose=require('mongoose');
var BaseModel = require("./base_model");

var Schema=mongoose.Schema;
var ObjectId=Schema.Types.ObjectId;

var NotebookSchema=new Schema({
    name: { type: String, required: true },//名称
    user: { type: ObjectId, required: true, ref: 'User' },//用户外键
    create_at: { type: Date, default: Date.now },//创建时间
    update_at: { type: Date, default: Date.now }//修改时间
});

NotebookSchema.plugin(BaseModel);

//保存前更新修改时间
NotebookSchema.pre('save',function(next){
    this.update_at=Date.now();
    next();
});

var Notebook=mongoose.model('Notebook', NotebookSchema);