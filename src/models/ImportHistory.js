const mongoose = require('mongoose');

const importHistorySchema = new mongoose.Schema({
  file_name: {
    type: String,
    required: true
  },
  file_type: {
    type: String,
    enum: ['xlsx', 'csv', 'json'],
    required: true
  },
  game_type_code: {
    type: String,
    required: true
  },
  question_set_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionSet'
  },
  total_rows: {
    type: Number,
    default: 0
  },
  valid_rows: {
    type: Number,
    default: 0
  },
  error_rows: {
    type: Number,
    default: 0
  },
  errors: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  suppressReservedKeysWarning: true
});

module.exports = mongoose.model('ImportHistory', importHistorySchema);
