const mongoose = require('mongoose');
const dns = require('dns');

// Chỉ thiết lập DNS máy chủ trên môi trường Windows cục bộ
// Tránh lỗi can thiệp DNS trên Linux / AWS / Vercel
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    console.warn('DNS server configuration warning:', e.message);
  }
}

let cachedConn = null;
let cachedPromise = null;

const connectDB = async () => {
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  if (!cachedPromise) {
    const uri = process.env.MONGODB_URI || 'mongodb://thgamedb:Tinhoc123%40@ac-jwjkqb1-shard-00-00.vmnlwbv.mongodb.net:27017,ac-jwjkqb1-shard-00-01.vmnlwbv.mongodb.net:27017,ac-jwjkqb1-shard-00-02.vmnlwbv.mongodb.net:27017/game_db?ssl=true&authSource=admin&retryWrites=true&w=majority';
    
    cachedPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }).then(conn => {
      cachedConn = conn;
      console.log(`[Database] MongoDB Atlas đã kết nối thành công: ${conn.connection.host}`);
      return conn;
    }).catch(err => {
      cachedPromise = null;
      console.error(`[Database Error] Lỗi kết nối MongoDB Atlas: ${err.message}`);
      throw err;
    });
  }

  return cachedPromise;
};

module.exports = connectDB;
