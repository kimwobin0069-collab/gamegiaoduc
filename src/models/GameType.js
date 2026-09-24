const mongoose = require('mongoose');

const gameTypeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'bi-controller'
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  default_config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('GameType', gameTypeSchema);
