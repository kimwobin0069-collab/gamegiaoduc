const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question_set_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionSet',
    required: true
  },
  order_index: {
    type: Number,
    default: 0
  },
  question_text: {
    type: String,
    required: true,
    trim: true
  },
  // Chứa dữ liệu linh hoạt tương ứng từng loại trong 6 trò chơi
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Chỉ mục hỗ trợ truy vấn nhanh theo bộ câu hỏi và thứ tự
questionSchema.index({ question_set_id: 1, order_index: 1 });

module.exports = mongoose.model('Question', questionSchema);
