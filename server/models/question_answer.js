var mongoose  = require('mongoose');
var BaseModel = require("./base_model");
var Schema    = mongoose.Schema;
var ObjectId  = Schema.ObjectId;

var QuestionAnswerSchema = new Schema({
  question_id: { type: ObjectId },
  answer_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now }
});

QuestionAnswerSchema.plugin(BaseModel);
QuestionAnswerSchema.index({question_id: 1, answer_id: 1}, {unique: true});

mongoose.model('QuestionAnswer', QuestionAnswerSchema);
