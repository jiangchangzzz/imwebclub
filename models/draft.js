/**
 * @file create/update topic draft
 * @author fishineyuan(382184760@qq.com)
 * @date 2015-02-26
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var DraftSchema = new Schema({
    author_id : { type: ObjectId },
    topic_id  : { type: ObjectId, default: null }, // 修改文章时使用
    tab       : { type: String },
    title     : { type: String },
    content   : { type: String },
    create_at : { type: Date, default: Date.now },
    update_at : { type: Date, default: Date.now }
});

DraftSchema.index({author_id: 1});
DraftSchema.index({topic_id: 1});

mongoose.model('Draft', DraftSchema);
