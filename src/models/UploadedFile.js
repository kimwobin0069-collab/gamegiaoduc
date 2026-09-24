const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema({
  original_name: {
    type: String,
    required: true
  },
  stored_name: {
    type: String,
    required: true
  },
  file_path: {
    type: String,
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  mime_type: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);
