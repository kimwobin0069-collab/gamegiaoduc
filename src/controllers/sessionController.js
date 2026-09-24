const GameSession = require('../models/GameSession');
const QuestionSet = require('../models/QuestionSet');
const Question = require('../models/Question');
const { GAME_TYPES, DEFAULT_TEAMS } = require('../config/constants');
const gameEngine = require('../services/gameEngine');

exports.getCreateSession = async (req, res) => {
  try {
    const [sets] = await Promise.all([
      QuestionSet.find().sort({ created_at: -1 }).lean()
    ]);

    // Thống kê số câu thực tế
    for (const s of sets) {
      s.actual_count = await Question.countDocuments({ question_set_id: s._id });
    }

    res.render('admin/session-create', {
      title: 'Thiết Lập Phiên Trò Chơi Mới',
      gameTypes: GAME_TYPES,
      questionSets: sets,
      defaultTeams: DEFAULT_TEAMS,
      error: req.session.flashError || null
    });
    delete req.session.flashError;
  } catch (error) {
    console.error('Lỗi tải trang tạo phiên:', error);
    res.status(500).send(error.message);
  }
};

exports.postCreateSession = async (req, res) => {
  try {
    const {
      game_type_code,
      question_set_id,
      team_count,
      initial_score,
      time_limit,
      sound_enabled,
      effects_enabled,
      random_order,
      strict_price,
      team_names,
      team_colors
    } = req.body;

    if (!game_type_code || !question_set_id) {
      req.session.flashError = 'Vui lòng chọn loại trò chơi và bộ câu hỏi!';
      return res.redirect('/admin/sessions/create');
    }

    // Xây dựng danh sách đội (2 đến 6 đội)
    const numTeams = Math.max(2, Math.min(6, Number(team_count) || 4));
    const teams = [];
    const names = Array.isArray(team_names) ? team_names : [team_names];
    const colors = Array.isArray(team_colors) ? team_colors : [team_colors];

    for (let i = 0; i < numTeams; i++) {
      teams.push({
        name: (names[i] && names[i].trim()) || DEFAULT_TEAMS[i]?.name || `Đội ${i + 1}`,
        color: colors[i] || DEFAULT_TEAMS[i]?.color || '#3b82f6'
      });
    }

    const session = await gameEngine.createSession({
      gameTypeCode: game_type_code,
      questionSetId: question_set_id,
      settings: {
        team_count: numTeams,
        initial_score: Number(initial_score) || 0,
        time_limit: Number(time_limit) || 30,
        sound_enabled: sound_enabled === 'on' || sound_enabled === true,
        effects_enabled: effects_enabled === 'on' || effects_enabled === true,
        random_order: random_order === 'on' || random_order === true,
        strict_price: strict_price === 'on' || strict_price === true
      },
      teams
    });

    res.redirect(`/admin/sessions/${session._id}/controller`);
  } catch (error) {
    console.error('Lỗi tạo phiên chơi:', error);
    req.session.flashError = 'Lỗi khi tạo phiên chơi: ' + error.message;
    res.redirect('/admin/sessions/create');
  }
};

exports.getController = async (req, res) => {
  try {
    const { id } = req.params;
    const sessionData = await gameEngine.getSessionWithQuestions(id);
    if (!sessionData || !sessionData.session) {
      return res.status(404).send('Không tìm thấy phiên trò chơi.');
    }

    const gameType = GAME_TYPES.find(g => g.code === sessionData.session.game_type_code);

    res.render('admin/controller', {
      title: `Điều Khiển - ${gameType ? gameType.name : 'Trò chơi'} (${sessionData.session.session_code})`,
      session: sessionData.session,
      questions: sessionData.questions,
      currentQuestion: sessionData.currentQuestion,
      gameType,
      gameTypes: GAME_TYPES
    });
  } catch (error) {
    console.error('Lỗi tải màn hình điều khiển:', error);
    res.status(500).send(error.message);
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await GameSession.findById(id).populate('question_set_id').lean();
    if (!session) return res.status(404).send('Không tìm thấy phiên trò chơi.');

    const gameType = GAME_TYPES.find(g => g.code === session.game_type_code);
    // Sắp xếp các đội theo thứ tự điểm giảm dần
    const rankedTeams = [...session.teams].sort((a, b) => b.score - a.score);

    res.render('summary/session-summary', {
      title: `Tổng Kết & Xếp Hạng - Phòng ${session.session_code}`,
      session,
      gameType,
      rankedTeams
    });
  } catch (error) {
    console.error('Lỗi tải trang tổng kết:', error);
    res.status(500).send(error.message);
  }
};
