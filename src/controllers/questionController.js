const Question = require('../models/Question');
const QuestionSet = require('../models/QuestionSet');
const ImportHistory = require('../models/ImportHistory');
const { GAME_TYPES } = require('../config/constants');
const { parseFile, validateImportData, createErrorReportWorkbook } = require('../services/importService');
const path = require('path');
const fs = require('fs');

exports.getCreateQuestion = async (req, res) => {
  try {
    const { set_id } = req.query;
    const sets = await QuestionSet.find().sort({ created_at: -1 }).lean();
    let currentSet = null;
    let questions = [];

    if (set_id) {
      currentSet = await QuestionSet.findById(set_id).lean();
      if (currentSet) {
        questions = await Question.find({ question_set_id: set_id }).sort({ order_index: 1 }).lean();
      }
    } else if (sets.length > 0) {
      currentSet = sets[0];
      questions = await Question.find({ question_set_id: currentSet._id }).sort({ order_index: 1 }).lean();
    }

    res.render('admin/question-create', {
      title: 'Nhập Câu Hỏi Thủ Công',
      sets,
      currentSet,
      questions,
      gameTypes: GAME_TYPES,
      success: req.session.flashSuccess || null,
      error: req.session.flashError || null
    });
    delete req.session.flashSuccess;
    delete req.session.flashError;
  } catch (error) {
    console.error('Lỗi tải trang nhập câu hỏi:', error);
    res.status(500).send(error.message);
  }
};

exports.postCreateQuestion = async (req, res) => {
  try {
    const { set_id, question_text, ...gameData } = req.body;
    if (!set_id || !question_text) {
      req.session.flashError = 'Vui lòng chọn bộ câu hỏi và nhập nội dung câu hỏi!';
      return res.redirect(`/admin/questions/create?set_id=${set_id || ''}`);
    }

    const set = await QuestionSet.findById(set_id);
    if (!set) {
      req.session.flashError = 'Không tìm thấy bộ câu hỏi!';
      return res.redirect('/admin/questions/create');
    }

    const count = await Question.countDocuments({ question_set_id: set._id });

    // Chuẩn hóa dữ liệu theo loại game
    const cleanData = {};
    for (const [key, val] of Object.entries(gameData)) {
      if (typeof val === 'string') cleanData[key] = val.trim();
      else cleanData[key] = val;
    }

    const newQ = new Question({
      question_set_id: set._id,
      order_index: count + 1,
      question_text: question_text.trim(),
      data: cleanData
    });

    await newQ.save();
    req.session.flashSuccess = 'Đã thêm câu hỏi thành công!';
    res.redirect(`/admin/questions/create?set_id=${set._id}`);
  } catch (error) {
    console.error('Lỗi lưu câu hỏi:', error);
    req.session.flashError = 'Lỗi khi lưu câu hỏi: ' + error.message;
    res.redirect('/admin/questions/create');
  }
};

exports.postDeleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const q = await Question.findById(id);
    const setId = q ? q.question_set_id : null;
    if (q) await Question.findByIdAndDelete(id);

    req.session.flashSuccess = 'Đã xóa câu hỏi thành công!';
    res.redirect(setId ? `/admin/questions/create?set_id=${setId}` : '/admin/question-sets');
  } catch (error) {
    console.error('Lỗi xóa câu hỏi:', error);
    res.status(500).send(error.message);
  }
};

exports.getImport = async (req, res) => {
  try {
    const sets = await QuestionSet.find().sort({ created_at: -1 }).lean();
    res.render('admin/question-import', {
      title: 'Import Câu Hỏi Từ Excel / CSV / JSON',
      sets,
      gameTypes: GAME_TYPES,
      error: req.session.flashError || null
    });
    delete req.session.flashError;
  } catch (error) {
    console.error('Lỗi tải trang import:', error);
    res.status(500).send(error.message);
  }
};

exports.postUploadImport = async (req, res) => {
  try {
    if (!req.file) {
      req.session.flashError = 'Vui lòng chọn tệp (.xlsx, .csv, .json) để tải lên!';
      return res.redirect('/admin/questions/import');
    }

    const { set_id } = req.body;
    if (!set_id) {
      req.session.flashError = 'Vui lòng chọn bộ câu hỏi đích!';
      return res.redirect('/admin/questions/import');
    }

    const set = await QuestionSet.findById(set_id);
    if (!set) {
      req.session.flashError = 'Không tìm thấy bộ câu hỏi đích!';
      return res.redirect('/admin/questions/import');
    }

    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    const rows = parseFile(req.file.path, ext);

    // Lấy danh sách câu hỏi đã có trong bộ để chống nhập trùng
    const existingQuestions = await Question.find({ question_set_id: set._id }).select('question_text').lean();
    const existingTexts = existingQuestions.map(q => q.question_text);

    // Xác thực dữ liệu
    const validationResult = validateImportData(rows, set.game_type_code, existingTexts);

    // Lưu kết quả vào session để chuyển sang trang Preview
    req.session.previewData = {
      setId: set._id.toString(),
      setName: set.name,
      gameTypeCode: set.game_type_code,
      fileName: req.file.originalname,
      fileType: ext,
      filePath: req.file.path,
      ...validationResult
    };

    res.redirect('/admin/questions/preview-import');
  } catch (error) {
    console.error('Lỗi upload và xử lý import:', error);
    req.session.flashError = 'Lỗi xử lý tệp: ' + error.message;
    res.redirect('/admin/questions/import');
  }
};

exports.getPreviewImport = (req, res) => {
  const preview = req.session.previewData;
  if (!preview) {
    return res.redirect('/admin/questions/import');
  }

  res.render('admin/question-preview', {
    title: 'Kiểm Tra & Xem Trước Dữ Liệu Import',
    preview
  });
};

exports.getDownloadErrorReport = (req, res) => {
  const preview = req.session.previewData;
  if (!preview || !preview.errorRows || preview.errorRows.length === 0) {
    return res.status(400).send('Không có báo cáo lỗi để tải xuống.');
  }

  const buffer = createErrorReportWorkbook(preview.errorRows);
  res.setHeader('Content-Disposition', 'attachment; filename="bao_cao_loi_import.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

exports.postSaveImport = async (req, res) => {
  try {
    const preview = req.session.previewData;
    if (!preview || !preview.validRows || preview.validRows.length === 0) {
      req.session.flashError = 'Không có dòng dữ liệu hợp lệ nào để lưu!';
      return res.redirect('/admin/questions/import');
    }

    const set = await QuestionSet.findById(preview.setId);
    if (!set) {
      req.session.flashError = 'Không tìm thấy bộ câu hỏi đích!';
      return res.redirect('/admin/questions/import');
    }

    const currentCount = await Question.countDocuments({ question_set_id: set._id });

    // Định dạng dữ liệu chèn vào CSDL
    const questionsToInsert = preview.validRows.map((item, idx) => {
      const row = item.data;
      const qText = row['question'] || row['clue'] || row['item_name'] || row['keyword'] || `Câu hỏi ${idx + 1}`;
      
      const specificData = { ...row };
      delete specificData['question'];

      return {
        question_set_id: set._id,
        order_index: currentCount + idx + 1,
        question_text: qText,
        data: specificData
      };
    });

    await Question.insertMany(questionsToInsert);

    // Ghi nhật ký ImportHistory
    const history = new ImportHistory({
      file_name: preview.fileName,
      file_type: preview.fileType,
      game_type_code: preview.gameTypeCode,
      question_set_id: set._id,
      total_rows: preview.totalRows,
      valid_rows: preview.validRows.length,
      error_rows: preview.errorRows.length,
      errors: preview.errorRows,
      status: preview.errorRows.length === 0 ? 'success' : 'partial'
    });
    await history.save();

    // Dọn dẹp session và file tạm
    if (preview.filePath && fs.existsSync(preview.filePath)) {
      try { fs.unlinkSync(preview.filePath); } catch (e) {}
    }
    delete req.session.previewData;

    req.session.flashSuccess = `Đã import thành công ${questionsToInsert.length} câu hỏi vào bộ "${set.name}"! (${preview.errorRows.length} dòng lỗi đã được bỏ qua).`;
    res.redirect(`/admin/questions/create?set_id=${set._id}`);
  } catch (error) {
    console.error('Lỗi lưu dữ liệu import:', error);
    req.session.flashError = 'Lỗi khi lưu dữ liệu import: ' + error.message;
    res.redirect('/admin/questions/import');
  }
};
