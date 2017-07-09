var mongoose=require('mongoose');
var BaseModel=require('./base_model');
var Schema=mongoose.Schema;
var ObjectId=Schema.ObjectId;

//系统消息数据模型
var SystemMessage=new Schema({
    title: { type: String, required: true },   //标题
    content: { type: String, required: true },   //内容
    owner_id: { type: ObjectId, required: true, ref: 'User'},   //创建人外键
    create_at: { type: Date, default: Date.now, index: true }   //创建时间
});

SystemMessage.plugin(BaseModel);

mongoose.model('SystemMessage', SystemMessage);
