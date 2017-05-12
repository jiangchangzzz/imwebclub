var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var UserFollowSchema = new Schema({
  user_id: { type: ObjectId },
  kind: { type: String },
  object_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now }
});

UserFollowSchema.plugin(BaseModel);
UserFollowSchema.index({user_id: 1, object_id: 1}, {unique: true});

mongoose.model('UserFollow', UserFollowSchema);
