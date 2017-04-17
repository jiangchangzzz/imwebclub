var mongoose = require('mongoose');
var BaseModel = require("./base_model");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require('../config');
var _ = require('lodash');

var TopicSchema = new Schema({
  tab: { type: String },
  title: { type: String },
  content: { type: String },
  summary: { type: String },
  pic: { type: Array },
  type: { type: Number, default: 0 }, //0-文章; 1-github组件; 2-讨论
  author_id: { type: ObjectId },
  top: { type: Boolean, default: false }, // 置顶帖
  good: { type: Boolean, default: false }, // 精华帖
  reply_count: { type: Number, default: 0 },
  visit_count: { type: Number, default: 0 },
  collect_count: { type: Number, default: 0 },
  create_at: { type: Date, default: Date.now },
  update_at: { type: Date, default: Date.now },
  last_reply: { type: ObjectId },
  last_reply_at: { type: Date, default: Date.now },
  content_is_html: { type: Boolean },
  reprint: { type: String, default: '' },
  lock: {type: Boolean, default: false}, // 被锁定主题
  deleted: {type: Boolean, default: false},
  draft: { type: ObjectId, ref: 'Draft' } // 更新时的草稿保存
});

TopicSchema.plugin(BaseModel);
TopicSchema.index({ create_at: -1 });
TopicSchema.index({ top: -1, last_reply_at: -1 });
TopicSchema.index({ visit_count: -1, collect_count: -1, reply_count: -1, create_at: -1 });
TopicSchema.index({ author_id: 1, create_at: -1 });

TopicSchema.virtual('tabName').get(function () {
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

mongoose.model('Topic', TopicSchema);
