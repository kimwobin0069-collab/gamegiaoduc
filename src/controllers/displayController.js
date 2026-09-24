const gameEngine = require('../services/gameEngine');
const { GAME_TYPES } = require('../config/constants');

exports.getProjector = async (req, res) => {
  try {
    const { code } = req.params;
    const sessionData = await gameEngine.getSessionWithQuestions(code);

    if (!sessionData || !sessionData.session) {
      return res.status(404).render('display/not-found', {
        title: 'Không Tìm Thấy Phiên Trò Chơi',
        code
      });
    }

    const { session, questions } = sessionData;
    const gameType = GAME_TYPES.find(g => g.code === session.game_type_code);

    // Dữ liệu an toàn không chứa đáp án trước khi GV công bố
    const sanitized = gameEngine.sanitizeForProjector(session, questions);

    res.render('display/projector', {
      layout: 'layouts/display-layout',
      title: `Trình Chiếu 16:9 - ${gameType ? gameType.name : 'Gameshow'} (${session.session_code})`,
      session,
      gameType,
      initialData: sanitized
    });
  } catch (error) {
    console.error('Lỗi tải màn hình máy chiếu:', error);
    res.status(500).send('Lỗi máy chủ khi tải màn hình trình chiếu: ' + error.message);
  }
};
