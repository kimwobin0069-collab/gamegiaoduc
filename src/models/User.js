const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true
  },
  display_name: {
    type: String,
    default: 'Quản Trị Viên'
  },
  role: {
    type: String,
    enum: ['admin', 'teacher'],
    default: 'admin'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Phương thức so khớp mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Hàm mã hóa mật khẩu trước khi lưu
userSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model('User', userSchema);
