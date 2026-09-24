require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./config/database');
const initSocket = require('./sockets');
const { setLocals } = require('./middlewares/auth');

// Khởi tạo Express & HTTP Server
const app = express();
const server = http.createServer(app);

// Kết nối Cơ sở dữ liệu MongoDB Atlas
connectDB();

// Cấu hình View Engine EJS & Layouts
app.use(expressLayouts);
app.set('layout', 'layouts/admin-layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cấu hình Middleware cơ bản
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));

// Phục vụ tệp tĩnh
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Cấu hình Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'gameshow_secret_le_thi_hong_gam',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 giờ
  }
}));

// Gán biến toàn cục cho EJS view
app.use(setLocals);

// Đăng ký các Routes
app.use(require('./routes/authRoutes'));
app.use(require('./routes/adminRoutes'));
app.use(require('./routes/questionRoutes'));
app.use(require('./routes/sessionRoutes'));
app.use(require('./routes/displayRoutes'));

// Xử lý trang 404
app.use((req, res) => {
  res.status(404).render('admin/error-404', {
    title: '404 - Không Tìm Thấy Trang'
  });
});

// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).send('Đã có lỗi nội bộ hệ thống: ' + err.message);
});

// Khởi tạo Socket.IO
const io = initSocket(server);

// Lắng nghe cổng
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎮 WEBSITE TRÒ CHƠI HỌC TẬP LỚP HỌC ĐÃ SẴN SÀNG!`);
  console.log(`🌐 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`🔑 Đăng nhập quản trị:   http://localhost:${PORT}/login`);
  console.log(`📺 Màn hình trình chiếu: http://localhost:${PORT}/display/<MÃ_PHÒNG>`);
  console.log(`====================================================`);
});

module.exports = { app, server, io };
