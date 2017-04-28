var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require('../config');
var _ = require('lodash');

var ActivitySchema = new Schema({
  tab: { type: String },//活动类型
  title: { type: String },
  content: { type: String },
  summary: { type: String },
  begin_time: { type: Date },
  begin_str: { type: String },
  end_time: { type: Date },
  end_str: { type: String },
  location_str: { type: String },
  pic: { type: Array },
  author_id: { type: ObjectId },
  ups: [Schema.Types.ObjectId],
  top: { type: Boolean, default: false }, // 置顶帖
  good: { type: Boolean, default: false }, // 精华帖
  reply_count: { type: Number, default: 0 },
  visit_count: { type: Number, default: 0 },
  collect_count: { type: Number, default: 0 },
  follower_count: { type: Number, default: 0 },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  last_reply: { type: ObjectId },
  last_reply_at: { type: Date, default: Date.now },
  content_is_html: { type: Boolean },
  reprint: { type: String, default: '' },
  lock: {type: Boolean, default: false}, // 被锁定主题
  deleted: {type: Boolean, default: false},
});

ActivitySchema.plugin(BaseModel);
ActivitySchema.index({ create_at: -1 });
ActivitySchema.index({ top: -1, last_reply_at: -1 });
ActivitySchema.index({ author_id: 1, create_at: -1 });

ActivitySchema.virtual('tabName').get(function () {
  var tab = this.tab;
  var pair = _.find(config.tabs, function (_pair) {
    return _pair[0] === tab;
  });

  if (pair) {
    return pair[1];
  } else {
    return '';
  }
});

mongoose.model('Activity', ActivitySchema);
