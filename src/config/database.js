const mongoose = require('mongoose');
const dns = require('dns');

// Thiết lập DNS máy chủ để giải quyết triệt để lỗi ECONNREFUSED _mongodb._tcp trên Windows/mạng VN
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server configuration warning:', e.message);
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://thgamedb:Tinhoc123%40@mydatabase.vmnlwbv.mongodb.net/game_db?retryWrites=true&w=majority&appName=MyDatabase';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    console.log(`[Database] MongoDB Atlas đã kết nối thành công: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Lỗi kết nối MongoDB Atlas: ${error.message}`);
    console.log('[Database] Vui lòng kiểm tra kết nối mạng Internet hoặc cấu hình .env');
    // Không thoát tiến trình để server vẫn có thể phản hồi trang lỗi hoặc thử lại
    return null;
  }
};

module.exports = connectDB;
