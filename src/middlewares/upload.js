const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Bộ lọc định dạng file hợp lệ - Nghiêm cấm file thực thi
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.xlsx', '.xls', '.csv', '.json', '.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Chặn tuyệt đối file thực thi
  const dangerousExts = ['.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.js', '.vbs', '.py', '.msi'];
  if (dangerousExts.includes(ext)) {
    return cb(new Error('Nghiêm cấm tải lên các tệp thực thi độc hại!'), false);
  }

  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng tệp không được hỗ trợ (${ext}). Chỉ chấp nhận .xlsx, .csv, .json hoặc hình ảnh.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // Tối đa 15MB
  }
});

module.exports = upload;
