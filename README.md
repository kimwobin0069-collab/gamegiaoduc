# NỀN TẢNG WEBSITE TRÒ CHƠI HỌC TẬP LỚP HỌC (EDUCATIONAL GAMESHOW PLATFORM)

Hệ thống ứng dụng web chuyên biệt dành cho giáo viên để tổ chức các cuộc thi, trò chơi học tập tương tác trực tiếp trên lớp học. Được thiết kế tối ưu cho máy chiếu / TV tỉ lệ 16:9, điều khiển thời gian thực qua **Socket.IO**, lưu trữ đám mây **MongoDB Atlas** và hỗ trợ import câu hỏi hàng loạt từ **Excel (.xlsx), CSV, JSON**.

---

## 1. DANH SÁCH 6 TRÒ CHƠI KINH ĐIỂN ĐÃ ĐƯỢC TÍCH HỢP

1. **Ai là triệu phú**:
   - Giao diện hoàng gia với câu hỏi và 4 phương án A, B, C, D.
   - Thang điểm bậc thang 15 mức tiền thưởng.
   - Chức năng chốt đáp án (hiệu ứng dạ quang cam) và công bố đáp án (đổi màu xanh lá / đỏ).
   - 3 quyền trợ giúp: 50:50, Hỏi ý kiến lớp học, Gợi ý từ giáo viên.
2. **Chiếc nón kỳ diệu**:
   - Vòng quay điểm thưởng Canvas tương tác mượt mà (10 ô: các mức điểm, Nhân đôi, Mất điểm, Mất lượt, Phần thưởng, Cộng điểm).
   - Ô chữ từ khóa tự động lật mở khi đoán đúng chữ cái.
   - Bảng 29 chữ cái tiếng Việt trực quan.
3. **Vượt chướng ngại vật**:
   - Bức ảnh bí mật được chia thành các mảnh ghép che phủ.
   - Trả lời câu hỏi hàng ngang để lật mở từng mảnh ghép.
   - Nút công bố toàn bộ hình ảnh và xác nhận đoán chướng ngại vật.
4. **Tăng tốc**:
   - Câu hỏi hiển thị kèm đồng hồ đếm ngược kịch tính.
   - Tự động chia điểm theo tốc độ và thời gian còn lại (40, 30, 20, 10 điểm).
   - Bảng xếp hạng cập nhật ngay sau mỗi câu.
5. **Ô chữ bí mật**:
   - Thuật toán dựng lưới ô chữ tự động (`crosswordService`), tự căn chỉnh theo độ dài và vị trí từ khóa dọc.
   - Cột từ khóa bí mật được làm nổi bật với viền vàng ánh kim.
   - Lật mở từng chữ cái hoặc mở toàn bộ hàng ngang.
6. **Hãy chọn giá đúng**:
   - Trình chiếu sản phẩm và thiết bị học tập.
   - Nhập giá đoán của các đội, hệ thống tự động tính toán độ chênh lệch và xếp hạng đội đoán gần nhất.
   - Tùy chọn quy tắc nghiêm ngặt: không được vượt quá giá thật.

---

## 2. CÔNG NGHỆ SỬ DỤNG

- **Backend**: Node.js (v20+), Express.js
- **Frontend**: EJS View Engine, CSS3 (Theme Gameshow hiện đại: Xanh đậm, Cyan, Vàng kim, Tím), JavaScript thuần
- **Cơ sở dữ liệu**: MongoDB Atlas (kết nối qua Mongoose, tích hợp cấu hình DNS Google chống lỗi SRV trên Windows)
- **Thời gian thực**: Socket.IO (đồng bộ tức thì giữa Điều khiển GV và Máy chiếu)
- **Xử lý bảng tính**: Thư viện `xlsx` (đọc, kiểm tra cú pháp và sinh 6 file mẫu Excel chuẩn)
- **Tải tệp & Bảo mật**: Multer (chặn file thực thi, giới hạn 15MB), bcryptjs (mã hóa mật khẩu)
- **Âm thanh Gameshow**: Web Audio API Synthesizer (tự động tạo nhạc suy nghĩ, chuông báo, keng keng, đúng/sai mà không cần file tải ngoài)

---

## 3. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY TỪNG BƯỚC

### Bước 1: Cài đặt thư viện phụ thuộc
Mở terminal trong thư mục dự án:
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường
File `.env` đã được cấu hình sẵn tài khoản quản trị và kết nối MongoDB Atlas:
```env
PORT=3000
SESSION_SECRET=gameshow_secret_key_thpt_le_thi_hong_gam_2026
MONGODB_URI=mongodb+srv://thgamedb:Tinhoc123%40@mydatabase.vmnlwbv.mongodb.net/game_db?retryWrites=true&w=majority&appName=MyDatabase
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123456
ADMIN_DISPLAY_NAME=Quản Trị Viên
NODE_ENV=development
```

### Bước 3: Chạy migration và seed dữ liệu
Khởi tạo 6 loại trò chơi, tài khoản quản trị admin và tự động sinh 6 file Excel mẫu trong thư mục `templates/`:
```bash
npm run migrate
```

### Bước 4: Khởi động máy chủ ứng dụng
Chạy ở chế độ phát triển (tự động theo dõi thay đổi):
```bash
npm run dev
```
Hoặc chạy ở chế độ production:
```bash
npm start
```

Sau khi chạy lệnh trên, truy cập trình duyệt:
- **Trang đăng nhập quản trị**: [http://localhost:3000/login](http://localhost:3000/login)
  - Tên đăng nhập: `admin`
  - Mật khẩu: `Admin@123456`
- **Màn hình máy chiếu**: [http://localhost:3000/display/<MÃ_PHÒNG>](http://localhost:3000/display/MÃ_PHÒNG)

---

## 4. QUY CHUẨN CỘT VÀ HƯỚNG DẪN IMPORT CÂU HỎI

Thầy/Cô có thể vào menu **"File Mẫu"** trên thanh điều hướng để tải trực tiếp 6 file Excel mẫu (.xlsx).

### Tiêu chuẩn các cột:

1. **Mẫu Trắc nghiệm (Ai là triệu phú & Tăng tốc)**:
   - `question`: Nội dung câu hỏi
   - `option_a`: Phương án A
   - `option_b`: Phương án B
   - `option_c`: Phương án C
   - `option_d`: Phương án D
   - `correct_answer`: Đáp án đúng (`A`, `B`, `C`, hoặc `D`)
   - `explanation`: Giải thích đáp án (tùy chọn)
   - `image`: Đường dẫn hoặc link ảnh (tùy chọn)
   - `time_limit`: Thời gian trả lời (giây)
   - `points` (hoặc `max_points`): Điểm số

2. **Mẫu Chiếc nón kỳ diệu**:
   - `keyword`: Từ khóa bí mật (ví dụ: `TU KHOA BI MAT`)
   - `category`: Chủ đề từ khóa
   - `hint_1`, `hint_2`, `hint_3`: Các mức độ gợi ý
   - `image`: Ảnh minh họa (tùy chọn)

3. **Mẫu Vượt chướng ngại vật**:
   - `question`: Nội dung câu hỏi hàng ngang
   - `answer`: Đáp án hàng ngang
   - `explanation`: Giải thích đáp án
   - `tile_index`: Số thứ tự mảnh ghép (1, 2, 3, 4...)
   - `image`: Ảnh minh họa
   - `points`: Điểm trả lời đúng hàng ngang

4. **Mẫu Ô chữ bí mật**:
   - `clue`: Câu gợi ý cho hàng ngang
   - `answer`: Đáp án ô chữ (ví dụ: `HOC TAP`)
   - `keyword_position`: Vị trí chữ cái nằm trên cột từ khóa dọc (số nguyên dương <= độ dài từ)
   - `row_number`: Số thứ tự hàng
   - `hint`: Gợi ý bổ sung
   - `image`: Ảnh minh họa (tùy chọn)

5. **Mẫu Hãy chọn giá đúng**:
   - `item_name`: Tên sản phẩm / thiết bị
   - `description`: Mô tả công dụng, tính năng
   - `image`: Ảnh minh họa
   - `correct_price`: Giá thực tế chính xác (VNĐ)
   - `minimum_price`: Giá sàn tham khảo
   - `maximum_price`: Giá trần tham khảo
   - `tolerance`: Độ lệch cho phép
   - `unit`: Đơn vị tính (mặc định: `VNĐ`)

### Quy trình Import an toàn:
1. Vào **Import Excel** -> Chọn bộ câu hỏi đích -> Chọn file `.xlsx`, `.csv` hoặc `.json`.
2. Hệ thống chuyển sang màn hình **Xem Trước (Preview)**:
   - Tự động kiểm tra đúng tên cột, kiểm tra phương án đúng, kiểm tra số âm, kiểm tra trùng lặp câu hỏi.
   - Đánh dấu màu đỏ và liệt kê chi tiết lý do lỗi của từng dòng.
   - Cho phép tải file báo cáo lỗi (`bao_cao_loi_import.xlsx`).
3. Bấm **"Bỏ qua lỗi & Lưu các dòng hợp lệ"** để hoàn tất nạp câu hỏi vào CSDL.

---

## 5. HƯỚNG DẪN TẠO VÀ ĐIỀU KHIỂN PHIÊN CHƠI

1. **Tạo phiên**:
   - Vào **"Tạo Phiên Chơi"** trên thanh menu.
   - Chọn loại trò chơi, chọn bộ câu hỏi.
   - Chọn số lượng đội (2 đến 6 đội), đặt tên đội và màu sắc đại diện cho từng đội.
   - Thiết lập thời gian đồng hồ, bật/tắt âm thanh và hiệu ứng.
   - Nhấn **"KHỞI ĐỘNG PHIÊN CHƠI NGAY"**.

2. **Mở Màn hình Trình chiếu (16:9)**:
   - Trên màn hình điều khiển GV, nhấn nút **"Mở Màn Hình Trình Chiếu (16:9)"** (hoặc mở đường link `/display/<MÃ_PHÒNG>` trên máy chiếu / TV).
   - Nhấn biểu tượng phóng to góc trên bên phải để vào chế độ toàn màn hình 16:9.

3. **Điều khiển thi đấu**:
   - **Đồng hồ**: Nhấn *Bắt đầu*, *Tạm dừng*, *Đặt lại*.
   - **Câu hỏi**: Nhấn *Câu tiếp theo*, *Câu trước*.
   - **Chốt đáp án & Công bố**: Nhấn *Chốt đáp án* (Ai là triệu phú) và *Công bố đáp án* để gửi kết quả sang máy chiếu kèm hiệu ứng pháo hoa và âm thanh chúc mừng.
   - **Bảng điểm**: Sử dụng các nút `+10`, `+20`, `+40`, `-10` cạnh tên từng đội. Nếu bấm nhầm, nhấn nút **"Hoàn tác (Undo)"** để thu hồi điểm ngay tức thì.
   - **Kết thúc**: Nhấn *Kết thúc trò chơi* để chuyển sang trang Tổng kết & Xếp hạng Top 1, Top 2, Top 3 với bục vinh quang.

---

## 6. KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTS)

Chạy bộ kiểm thử tự động tích hợp:
```bash
npm test
```
Bộ test bao gồm:
- Kiểm thử xác thực & băm mật khẩu (`tests/auth.test.js`)
- Kiểm thử xác thực cột & bắt lỗi import câu hỏi (`tests/import.test.js`)
- Kiểm thử chống trùng lặp câu hỏi
- Kiểm thử logic tính điểm Tăng tốc & tính năng Hoàn tác (Undo) (`tests/scoring.test.js`)
- Kiểm thử đồng hồ đếm ngược & trạng thái khẩn cấp (`tests/timer.test.js`)
- Kiểm thử an toàn Socket.IO (không để lộ đáp án đúng sang màn hình máy chiếu trước khi GV công bố) (`tests/socket.test.js`)
