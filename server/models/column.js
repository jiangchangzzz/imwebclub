var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require('../config');
var _ = require('lodash');

var ColumnSchema = new Schema({
  title: { type: String },//标题
  cover: { type: String },//封面图
  description: { type: String },//描述
  owner_id: { type: ObjectId },//创建者id
  follower_count: { type: Number, default: 0 },//关注人数
  topic_count: { type: Number, default: 0 },//文章数目
  create_at: { type: Date, default: Date.now },//创建时间
  update_at: { type: Date, default: Date.now },//修改时间
  deleted: {type: Boolean, default: false},//是否删除
});

ColumnSchema.plugin(BaseModel);
ColumnSchema.index({ create_at: -1, topic_count: -1 });
ColumnSchema.index({ create_at: -1, follower_count: -1 });

mongoose.model('Column', ColumnSchema);