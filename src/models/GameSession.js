const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  session_code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  game_type_code: {
    type: String,
    required: true
  },
  question_set_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionSet',
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'paused', 'ended'],
    default: 'waiting'
  },
  current_question_index: {
    type: Number,
    default: 0
  },
  settings: {
    team_count: { type: Number, default: 4 },
    initial_score: { type: Number, default: 0 },
    time_limit: { type: Number, default: 30 },
    sound_enabled: { type: Boolean, default: true },
    effects_enabled: { type: Boolean, default: true },
    random_order: { type: Boolean, default: false },
    strict_price: { type: Boolean, default: false }
  },
  teams: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      color: { type: String, default: '#3b82f6' },
      score: { type: Number, default: 0 },
      order_index: { type: Number, default: 0 }
    }
  ],
  current_state: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      is_question_visible: true,
      is_answer_revealed: false,
      is_locked: false,
      selected_answer: null,
      timer: { running: false, remaining: 30, total: 30 },
      active_team_index: 0,
      lifelines_used: [],
      // Dành riêng cho Chiếc nón kỳ diệu
      wheel_state: {
        spinning: false,
        current_sector: null,
        revealed_letters: [],
        disabled_letters: [],
        guess_keyword_revealed: false
      },
      // Dành riêng cho Vượt chướng ngại vật
      obstacle_state: {
        opened_tiles: [],
        obstacle_guessed: false,
        full_image_revealed: false
      },
      // Dành riêng cho Ô chữ bí mật
      crossword_state: {
        active_row: null,
        opened_rows: [],
        opened_letters: {},
        keyword_revealed: false
      },
      // Dành riêng cho Hãy chọn giá đúng
      price_state: {
        guesses: {},
        revealed: false,
        winner_team_id: null
      }
    }
  },
  score_history: [
    {
      id: { type: String },
      team_id: { type: String },
      team_name: { type: String },
      delta: { type: Number },
      reason: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  created_at: {
    type: Date,
    default: Date.now
  },
  ended_at: {
    type: Date
  }
});

module.exports = mongoose.model('GameSession', gameSessionSchema);
