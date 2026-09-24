const mongoose = require('mongoose');

const questionSetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    default: 'Chung'
  },
  grade: {
    type: String,
    default: 'Tất cả'
  },
  topic: {
    type: String,
    default: ''
  },
  game_type_code: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  created_by: {
    type: String,
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'active'
  },
  question_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('QuestionSet', questionSetSchema);
