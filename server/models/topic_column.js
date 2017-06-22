var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var TopicColumnSchema = new Schema({
  topic_id: { type: ObjectId },
  column_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now }
});

TopicColumnSchema.plugin(BaseModel);
TopicColumnSchema.index({topic_id: 1, column_id: 1}, {unique: true});

mongoose.model('TopicColumn', TopicColumnSchema);