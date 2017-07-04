var mongoose=require('mongoose');
var BaseModel=require('./base_model');
var Schema=mongoose.Schema;
var ObjectId=Schema.ObjectId;

//系统消息
var SystemMessage=new Schema({
    title: { type: String },   //标题
    content: { type: String },
    owner_id: { type: ObjectId, ref: 'User'},
    create_at: { type: Date, default: Date.now() },
    deleted: { type: Boolean, default: false } 
});

SystemMessage.plugin(BaseModel);
SystemMessage.index({create_at: -1});

mongoose.model('SystemMessage', SystemMessage);
