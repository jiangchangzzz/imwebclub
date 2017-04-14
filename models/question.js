var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require('../config');
var _ = require('lodash');

var QuestionSchema = new Schema({
  tab: { type: String },
  title: { type: String },
  content: { type: String },
  summary: { type: String },
  pic: { type: Array },
  solve: {type: Number, default: 0}, // 0 未解决  1 已解决
  author_id: { type: ObjectId },
  reply_count: { type: Number, default: 0 },
  visit_count: { type: Number, default: 0 },
  collect_count: { type: Number, default: 0 },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  last_reply: { type: ObjectId },
  last_reply_at: { type: Date, default: Date.now },
  content_is_html: { type: Boolean },
  // reprint: { type: String, default: '' },
  top: { type: Boolean, default: false }, // 置顶
  good: { type: Boolean, default: false }, // 精华
  lock: {type: Boolean, default: false}, // 锁定
  deleted: {type: Boolean, default: false},
  draft: { type: ObjectId, ref: 'Draft' } // 更新时的草稿保存
});

QuestionSchema.plugin(BaseModel);
QuestionSchema.index({ create_at: -1 });
QuestionSchema.index({ top: -1, last_reply_at: -1 });
QuestionSchema.index({ author_id: 1, create_at: -1 });

QuestionSchema.virtual('tabName').get(function () {
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

mongoose.model('Question', QuestionSchema);
