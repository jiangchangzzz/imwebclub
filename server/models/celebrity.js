var mongoose=require('mongoose');
var BaseModel = require("./base_model");
var Schema=mongoose.Schema;
var ObjectId=mongoose.Schema.Types.ObjectId;

//名人堂数据模型
var CelebritySchema=new Schema({
    name: { type: String, required: true },//姓名  
    company: { type: String },//公司         
    github: { type: String },//github主页
    home: { type: String },//个人主页
    description: { type: String },//简介
    avatar: { type: String },//头像url
    userId: { type: ObjectId, ref: 'User' },//用户外键
    create_at: { type: Date, default: Date.now }//创建时间
});

CelebritySchema.plugin(BaseModel);
mongoose.model('Celebrity',CelebritySchema);

