const QuestionSet = require('../models/QuestionSet');
const Question = require('../models/Question');
const { GAME_TYPES } = require('../config/constants');
const XLSX = require('xlsx');

exports.getQuestionSets = async (req, res) => {
  try {
    const { game_type, subject } = req.query;
    const filter = {};
    if (game_type) filter.game_type_code = game_type;
    if (subject) filter.subject = subject;

    const sets = await QuestionSet.find(filter).sort({ created_at: -1 }).lean();

    // Lấy số lượng câu hỏi thực tế của từng bộ
    for (const s of sets) {
      s.actual_count = await Question.countDocuments({ question_set_id: s._id });
    }

    res.render('admin/question-sets', {
      title: 'Quản Lý Bộ Câu Hỏi',
      sets,
      gameTypes: GAME_TYPES,
      selectedGameType: game_type || '',
      selectedSubject: subject || '',
      success: req.session.flashSuccess || null,
      error: req.session.flashError || null
    });
    delete req.session.flashSuccess;
    delete req.session.flashError;
  } catch (error) {
    console.error('Lỗi lấy danh sách bộ câu hỏi:', error);
    res.status(500).send(error.message);
  }
};

exports.postCreateSet = async (req, res) => {
  try {
    const { name, subject, grade, topic, game_type_code, description } = req.body;
    if (!name || !game_type_code) {
      req.session.flashError = 'Vui lòng nhập tên bộ câu hỏi và chọn loại trò chơi!';
      return res.redirect('/admin/question-sets');
    }

    const newSet = new QuestionSet({
      name: name.trim(),
      subject: subject ? subject.trim() : 'Chung',
      grade: grade ? grade.trim() : 'Tất cả',
      topic: topic ? topic.trim() : '',
      game_type_code,
      description: description ? description.trim() : '',
      created_by: req.session.user ? req.session.user.displayName : 'Quản Trị Viên'
    });

    await newSet.save();
    req.session.flashSuccess = `Đã tạo thành công bộ câu hỏi "${newSet.name}"!`;
    res.redirect('/admin/question-sets');
  } catch (error) {
    console.error('Lỗi tạo bộ câu hỏi:', error);
    req.session.flashError = 'Có lỗi xảy ra khi tạo bộ câu hỏi: ' + error.message;
    res.redirect('/admin/question-sets');
  }
};

exports.postDuplicateSet = async (req, res) => {
  try {
    const { id } = req.params;
    const originalSet = await QuestionSet.findById(id);
    if (!originalSet) {
      req.session.flashError = 'Không tìm thấy bộ câu hỏi để sao chép!';
      return res.redirect('/admin/question-sets');
    }

    const duplicatedSet = new QuestionSet({
      name: `${originalSet.name} (Bản sao)`,
      subject: originalSet.subject,
      grade: originalSet.grade,
      topic: originalSet.topic,
      game_type_code: originalSet.game_type_code,
      description: originalSet.description,
      created_by: req.session.user ? req.session.user.displayName : 'Quản Trị Viên'
    });
    await duplicatedSet.save();

    // Sao chép toàn bộ câu hỏi con
    const questions = await Question.find({ question_set_id: originalSet._id }).lean();
    if (questions.length > 0) {
      const duplicatedQuestions = questions.map(q => ({
        question_set_id: duplicatedSet._id,
        order_index: q.order_index,
        question_text: q.question_text,
        data: q.data
      }));
      await Question.insertMany(duplicatedQuestions);
    }

    req.session.flashSuccess = `Đã sao chép thành công bộ câu hỏi và ${questions.length} câu hỏi con!`;
    res.redirect('/admin/question-sets');
  } catch (error) {
    console.error('Lỗi sao chép bộ câu hỏi:', error);
    req.session.flashError = 'Lỗi sao chép: ' + error.message;
    res.redirect('/admin/question-sets');
  }
};

exports.getExportSet = async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format || 'xlsx';
    const set = await QuestionSet.findById(id);
    if (!set) return res.status(404).send('Không tìm thấy bộ câu hỏi');

    const questions = await Question.find({ question_set_id: set._id }).sort({ order_index: 1 }).lean();

    if (format === 'json') {
      res.setHeader('Content-disposition', `attachment; filename="${encodeURIComponent(set.name)}.json"`);
      res.setHeader('Content-type', 'application/json');
      return res.send(JSON.stringify({ set, questions }, null, 2));
    }

    // Xuất Excel
    const rows = questions.map((q, idx) => {
      const flat = {
        'STT': idx + 1,
        'Nội dung câu hỏi': q.question_text,
        ...(q.data || {})
      };
      return flat;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(set.name)}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Lỗi xuất dữ liệu:', error);
    res.status(500).send(error.message);
  }
};

exports.postDeleteSet = async (req, res) => {
  try {
    const { id } = req.params;
    await Question.deleteMany({ question_set_id: id });
    await QuestionSet.findByIdAndDelete(id);
    req.session.flashSuccess = 'Đã xóa bộ câu hỏi và toàn bộ câu hỏi liên quan!';
    res.redirect('/admin/question-sets');
  } catch (error) {
    console.error('Lỗi xóa bộ câu hỏi:', error);
    req.session.flashError = 'Lỗi khi xóa: ' + error.message;
    res.redirect('/admin/question-sets');
  }
};

exports.postBulkDeleteQuestions = async (req, res) => {
  try {
    const { question_ids, set_id } = req.body;
    if (question_ids && Array.isArray(question_ids)) {
      await Question.deleteMany({ _id: { $in: question_ids } });
      req.session.flashSuccess = `Đã xóa thành công ${question_ids.length} câu hỏi!`;
    }
    res.redirect(set_id ? `/admin/questions/create?set_id=${set_id}` : '/admin/question-sets');
  } catch (error) {
    console.error('Lỗi xóa hàng loạt:', error);
    res.status(500).send(error.message);
  }
};
