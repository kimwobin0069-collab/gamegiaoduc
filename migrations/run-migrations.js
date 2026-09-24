require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const User = require('../src/models/User');
const GameType = require('../src/models/GameType');
const QuestionSet = require('../src/models/QuestionSet');
const Question = require('../src/models/Question');
const { GAME_TYPES } = require('../src/config/constants');
const { generateAllTemplates } = require('../src/services/templateService');

async function runMigrations() {
  console.log('--- BẮT ĐẦU CHẠY MIGRATION VÀ SEED DỮ LIỆU ---');
  await connectDB();

  try {
    // 1. Seed 6 loại trò chơi
    console.log('[1/4] Đang đồng bộ 6 loại trò chơi...');
    for (const gt of GAME_TYPES) {
      await GameType.findOneAndUpdate(
        { code: gt.code },
        {
          code: gt.code,
          name: gt.name,
          description: gt.description,
          icon: gt.icon,
          color: gt.color,
          default_config: gt.default_config
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Đã đồng bộ 6 loại trò chơi thành công.');

    // 2. Seed tài khoản Quản trị viên từ biến môi trường
    console.log('[2/4] Đang tạo tài khoản Quản trị viên...');
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'Quản Trị Viên';

    const existingAdmin = await User.findOne({ username: adminUsername });
    const passwordHash = await User.hashPassword(adminPassword);

    if (existingAdmin) {
      existingAdmin.password_hash = passwordHash;
      existingAdmin.display_name = adminDisplayName;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log(`✅ Đã cập nhật mật khẩu cho tài khoản admin: "${adminUsername}"`);
    } else {
      const newAdmin = new User({
        username: adminUsername,
        password_hash: passwordHash,
        display_name: adminDisplayName,
        role: 'admin'
      });
      await newAdmin.save();
      console.log(`✅ Đã tạo mới tài khoản admin: "${adminUsername}" (Mật khẩu: ${adminPassword})`);
    }

    // 3. Tự động sinh 6 file Excel mẫu trong thư mục templates/
    console.log('[3/4] Đang tạo các file Excel mẫu chuẩn...');
    generateAllTemplates(false); // Chỉ chứa tiêu đề cột theo đúng yêu cầu bàn giao

    // 4. Tạo bộ câu hỏi giữ chỗ (placeholder) kiểm thử khung sườn nếu chưa có
    console.log('[4/4] Kiểm tra bộ câu hỏi giữ chỗ (Placeholder)...');
    const existingSets = await QuestionSet.countDocuments();
    if (existingSets === 0) {
      console.log('Chưa có bộ câu hỏi, đang tạo các bộ giữ chỗ mẫu để kiểm thử giao diện...');
      
      // Bộ 1: Ai là triệu phú (Placeholder)
      const set1 = await QuestionSet.create({
        name: 'Bộ Câu Hỏi Mẫu - Ai Là Triệu Phú',
        subject: 'Kiểm Thử',
        grade: 'Tất cả',
        topic: 'Giao diện & Logic',
        game_type_code: 'millionaire',
        description: 'Bộ câu hỏi giữ chỗ dùng để kiểm thử tính năng và thang điểm',
        created_by: adminDisplayName
      });

      for (let i = 1; i <= 5; i++) {
        await Question.create({
          question_set_id: set1._id,
          order_index: i,
          question_text: `Nội dung câu hỏi số ${i}`,
          data: {
            option_a: `Phương án A cho câu ${i}`,
            option_b: `Phương án B cho câu ${i}`,
            option_c: `Phương án C cho câu ${i}`,
            option_d: `Phương án D cho câu ${i}`,
            correct_answer: i % 2 === 0 ? 'B' : 'A',
            explanation: `Giải thích chi tiết cho câu hỏi ${i}`,
            time_limit: 30,
            points: 100 * i
          }
        });
      }

      // Bộ 2: Chiếc nón kỳ diệu (Placeholder)
      const set2 = await QuestionSet.create({
        name: 'Bộ Câu Hỏi Mẫu - Chiếc Nón Kỳ Diệu',
        subject: 'Kiểm Thử',
        grade: 'Tất cả',
        game_type_code: 'wheel',
        description: 'Bộ câu hỏi giữ chỗ kiểm thử vòng quay và đoán từ khóa',
        created_by: adminDisplayName
      });

      await Question.create({
        question_set_id: set2._id,
        order_index: 1,
        question_text: 'Chủ đề: Từ khóa bí mật',
        data: {
          keyword: 'TU KHOA BI MAT',
          category: 'Chủ đề giữ chỗ',
          hint_1: 'Gợi ý 1',
          hint_2: 'Gợi ý 2',
          hint_3: 'Gợi ý 3'
        }
      });

      // Bộ 3: Vượt chướng ngại vật (Placeholder)
      const set3 = await QuestionSet.create({
        name: 'Bộ Câu Hỏi Mẫu - Vượt Chướng Ngại Vật',
        subject: 'Kiểm Thử',
        grade: 'Tất cả',
        game_type_code: 'obstacle',
        description: 'Bộ câu hỏi giữ chỗ kiểm thử mảnh ghép và hình ảnh',
        created_by: adminDisplayName
      });

      for (let i = 1; i <= 4; i++) {
        await Question.create({
          question_set_id: set3._id,
          order_index: i,
          question_text: `Nội dung câu hỏi hàng ngang ${i}`,
          data: {
            answer: `DAP AN ${i}`,
            explanation: `Giải thích hàng ngang ${i}`,
            tile_index: i,
            points: 10
          }
        });
      }

      // Bộ 4: Tăng tốc (Placeholder)
      const set4 = await QuestionSet.create({
        name: 'Bộ Câu Hỏi Mẫu - Tăng Tốc',
        subject: 'Kiểm Thử',
        grade: 'Tất cả',
        game_type_code: 'acceleration',
        description: 'Bộ câu hỏi giữ chỗ kiểm thử đồng hồ đếm ngược và điểm giảm dần',
        created_by: adminDisplayName
      });

      for (let i = 1; i <= 4; i++) {
        await Question.create({
          question_set_id: set4._id,
          order_index: i,
          question_text: `Nội dung câu hỏi tăng tốc ${i}`,
          data: {
            option_a: 'Phương án A',
            option_b: 'Phương án B',
            option_c: 'Phương án C',
            option_d: 'Phương án D',
            correct_answer: 'C',
            explanation: 'Giải thích đáp án',
            time_limit: 10 * i,
            max_points: 40
          }
        });
      }

      // Bộ 5: Ô chữ bí mật (Placeholder)
      const set5 = await QuestionSet.create({
        name: 'Bộ Câu Hỏi Mẫu - Ô Chữ Bí Mật',
        subject: 'Kiểm Thử',
        grade: 'Tất cả',
        game_type_code: 'crossword',
        description: 'Bộ câu hỏi giữ chỗ kiểm thử lưới ô chữ tự động',
        created_by: adminDisplayName
      });

      const crosswordSample = [
        { clue: 'Gợi ý hàng ngang 1', answer: 'HOAT DONG', kwPos: 2 },
        { clue: 'Gợi ý hàng ngang 2', answer: 'HOC TAP', kwPos: 3 },
        { clue: 'Gợi ý hàng ngang 3', answer: 'GIAO VIEN', kwPos: 4 },
        { clue: 'Gợi ý hàng ngang 4', answer: 'HOC SINH', kwPos: 1 }
      ];

      for (let i = 0; i < crosswordSample.length; i++) {
        await Question.create({
          question_set_id: set5._id,
          order_index: i + 1,
          question_text: crosswordSample[i].clue,
          data: {
            clue: crosswordSample[i].clue,
            answer: crosswordSample[i].answer,
            keyword_position: crosswordSample[i].kwPos,
            row_number: i + 1,
            hint: 'Gợi ý bổ sung'
          }
        });
      }

      // Bộ 6: Hãy chọn giá đúng (Placeholder)
      const set6 = await QuestionSet.create({
        name: 'Bộ Câu Hỏi Mẫu - Hãy Chọn Giá Đúng',
        subject: 'Kiểm Thử',
        grade: 'Tất cả',
        game_type_code: 'price_is_right',
        description: 'Bộ câu hỏi giữ chỗ kiểm thử đoán giá và tính độ chênh lệch',
        created_by: adminDisplayName
      });

      await Question.create({
        question_set_id: set6._id,
        order_index: 1,
        question_text: 'Sản phẩm thử nghiệm',
        data: {
          item_name: 'Thiết bị học tập mẫu',
          description: 'Mô tả tính năng thiết bị',
          correct_price: 250000,
          minimum_price: 150000,
          maximum_price: 350000,
          tolerance: 10000,
          unit: 'VNĐ'
        }
      });
      console.log('✅ Đã tạo xong các bộ câu hỏi giữ chỗ mẫu cho 6 trò chơi.');
    } else {
      console.log(`ℹ️ CSDL đã có ${existingSets} bộ câu hỏi, giữ nguyên dữ liệu hiện có.`);
    }

    console.log('--- HOÀN TẤT MIGRATION THÀNH CÔNG! ---');
  } catch (err) {
    console.error('❌ Lỗi trong quá trình migration:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runMigrations();
