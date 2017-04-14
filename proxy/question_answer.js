var QuestionAnswer = require('../models').QuestionAnswer;
var _ = require('lodash')

exports.getQuestionAnswer = function (questionId, answerId, callback) {
  var query = {
    question_id: questionId
  }
  if(answerId){
    query.answer_id = answerId;
  }
  QuestionAnswer.findOne(query, callback);
};

exports.newAndSave = function (questionId, answerId, callback) {
  var question_answer      = new QuestionAnswer();
  question_answer.question_id = questionId;
  question_answer.answer_id  = answerId;
  question_answer.save(callback);
};

exports.remove = function (questionId, answerId, callback) {
  var query = {
    question_id: questionId
  }
  if(answerId){
    query.answer_id = answerId;
  }
  QuestionAnswer.remove(query, callback);
};
