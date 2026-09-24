const QuestionSet = require('../models/QuestionSet');
const Question = require('../models/Question');
const GameSession = require('../models/GameSession');
const { GAME_TYPES } = require('../config/constants');

exports.getDashboard = async (req, res) => {
  try {
    const [totalSets, totalQuestions, activeSessions, recentSessions] = await Promise.all([
      QuestionSet.countDocuments(),
      Question.countDocuments(),
      GameSession.countDocuments({ status: { $in: ['waiting', 'playing', 'paused'] } }),
      GameSession.find().sort({ created_at: -1 }).limit(5).populate('question_set_id').lean()
    ]);

    res.render('admin/dashboard', {
      title: 'Bảng Điều Khiển Quản Trị - Gameshow Học Tập',
      stats: {
        totalSets,
        totalQuestions,
        activeSessions
      },
      recentSessions,
      gameTypes: GAME_TYPES
    });
  } catch (error) {
    console.error('Lỗi tải Dashboard:', error);
    res.status(500).render('admin/dashboard', {
      title: 'Bảng Điều Khiển Quản Trị',
      stats: { totalSets: 0, totalQuestions: 0, activeSessions: 0 },
      recentSessions: [],
      gameTypes: GAME_TYPES,
      error: error.message
    });
  }
};

exports.getGames = (req, res) => {
  res.render('admin/games', {
    title: 'Danh Sách 6 Trò Chơi Học Tập',
    gameTypes: GAME_TYPES
  });
};
