var mongoose=require('mongoose');
var BaseModel=require('./base_model');
var Schema=mongoose.Schema;
var ObjectId=Schema.ObjectId;

//系统消息
var SystemMessage=new Schema({
    title: { type: String },   //标题
    content: { type: String },   //内容
    owner_id: { type: ObjectId, ref: 'User'},   //创建人
    create_at: { type: Date, default: Date.now, index: true },   //创建时间
    deleted: { type: Boolean, default: false }    //是否删除
});

SystemMessage.plugin(BaseModel);

mongoose.model('SystemMessage', SystemMessage);
