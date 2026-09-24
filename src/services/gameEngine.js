const GameSession = require('../models/GameSession');
const Question = require('../models/Question');
const QuestionSet = require('../models/QuestionSet');
const { generateCrosswordGrid } = require('./crosswordService');

/**
 * Động Cơ Trò Chơi (Game Engine) - Quản lý trạng thái và đồng bộ
 */
class GameEngine {
  constructor() {
    this.activeTimers = new Map(); // sessionId -> timerInterval
  }

  /**
   * Tạo phiên chơi mới
   */
  async createSession({ gameTypeCode, questionSetId, settings, teams }) {
    // Tạo mã phòng ngẫu nhiên 6 ký tự
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let sessionCode = '';
    for (let i = 0; i < 6; i++) {
      sessionCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const session = new GameSession({
      session_code: sessionCode,
      game_type_code: gameTypeCode,
      question_set_id: questionSetId,
      status: 'waiting',
      current_question_index: 0,
      settings: {
        team_count: teams.length,
        initial_score: settings.initial_score || 0,
        time_limit: settings.time_limit || 30,
        sound_enabled: settings.sound_enabled !== false,
        effects_enabled: settings.effects_enabled !== false,
        random_order: !!settings.random_order,
        strict_price: !!settings.strict_price
      },
      teams: teams.map((t, idx) => ({
        id: `team_${idx + 1}`,
        name: t.name,
        color: t.color,
        score: settings.initial_score || 0,
        order_index: idx
      })),
      current_state: {
        is_question_visible: true,
        is_answer_revealed: false,
        is_locked: false,
        selected_answer: null,
        timer: { running: false, remaining: settings.time_limit || 30, total: settings.time_limit || 30 },
        active_team_index: 0,
        lifelines_used: [],
        wheel_state: {
          spinning: false,
          current_sector: null,
          revealed_letters: [],
          disabled_letters: [],
          guess_keyword_revealed: false
        },
        obstacle_state: {
          opened_tiles: [],
          obstacle_guessed: false,
          full_image_revealed: false
        },
        crossword_state: {
          active_row: null,
          opened_rows: [],
          opened_letters: {},
          keyword_revealed: false
        },
        price_state: {
          guesses: {},
          revealed: false,
          winner_team_id: null
        }
      }
    });

    await session.save();
    return session;
  }

  /**
   * Lấy chi tiết phiên chơi kèm câu hỏi hiện tại
   */
  async getSessionWithQuestions(sessionIdOrCode) {
    let session;
    if (sessionIdOrCode.length === 6) {
      session = await GameSession.findOne({ session_code: sessionIdOrCode.toUpperCase() });
    } else {
      session = await GameSession.findById(sessionIdOrCode);
    }

    if (!session) return null;

    const questions = await Question.find({ question_set_id: session.question_set_id })
      .sort({ order_index: 1 })
      .lean();

    return {
      session,
      questions,
      currentQuestion: questions[session.current_question_index] || null
    };
  }

  /**
   * Khử thông tin nhạy cảm trước khi gửi sang Màn hình Trình chiếu
   */
  sanitizeForProjector(session, questions) {
    const raw = session.toObject ? session.toObject() : JSON.parse(JSON.stringify(session));
    const currentQ = questions[raw.current_question_index] ? { ...questions[raw.current_question_index] } : null;

    if (currentQ) {
      // BẢO MẬT: Nếu giáo viên chưa bấm công bố đáp án -> xóa đáp án đúng khỏi payload
      if (!raw.current_state.is_answer_revealed) {
        if (currentQ.data) {
          delete currentQ.data.correct_answer;
          delete currentQ.data.explanation;
          delete currentQ.data.correct_price;
          // Đối với vòng Chiếc nón kỳ diệu, ẩn từ khóa chính nếu chưa đoán đúng
          if (raw.game_type_code === 'wheel' && !raw.current_state.wheel_state.guess_keyword_revealed) {
            delete currentQ.data.keyword;
          }
          // Đối với Vượt chướng ngại vật
          if (raw.game_type_code === 'obstacle' && !raw.current_state.obstacle_state.obstacle_guessed) {
            delete currentQ.data.answer;
          }
        }
      }
    }

    // Xử lý lưới ô chữ
    let crosswordGrid = null;
    if (raw.game_type_code === 'crossword') {
      crosswordGrid = generateCrosswordGrid(questions);
      // Ẩn các chữ cái chưa mở trong grid
      if (!raw.current_state.crossword_state.keyword_revealed) {
        crosswordGrid.grid = crosswordGrid.grid.map(row => {
          const isRowOpened = raw.current_state.crossword_state.opened_rows.includes(row.rowNumber);
          return {
            ...row,
            answer: isRowOpened ? row.answer : '',
            cells: row.cells.map(cell => {
              if (cell.type === 'letter') {
                const isCellOpened = isRowOpened || raw.current_state.crossword_state.opened_letters[cell.cellId];
                return {
                  ...cell,
                  char: isCellOpened ? cell.char : ''
                };
              }
              return cell;
            })
          };
        });
      }
    }

    return {
      sessionCode: raw.session_code,
      gameTypeCode: raw.game_type_code,
      status: raw.status,
      currentQuestionIndex: raw.current_question_index,
      totalQuestions: questions.length,
      currentQuestion: currentQ,
      teams: raw.teams,
      currentState: raw.current_state,
      crosswordGrid,
      settings: raw.settings
    };
  }

  /**
   * Cộng/trừ điểm với lưu lịch sử để Hoàn tác (Undo)
   */
  async adjustScore(sessionId, teamId, delta, reason = 'Cộng điểm thủ công') {
    const session = await GameSession.findById(sessionId);
    if (!session) return null;

    const team = session.teams.find(t => t.id === teamId);
    if (!team) return null;

    team.score += Number(delta);
    session.score_history.push({
      id: `act_${Date.now()}`,
      team_id: team.id,
      team_name: team.name,
      delta: Number(delta),
      reason,
      timestamp: new Date()
    });

    session.markModified('teams');
    session.markModified('score_history');
    await session.save();
    return session;
  }

  /**
   * Hoàn tác (Undo) thao tác tính điểm gần nhất
   */
  async undoScore(sessionId) {
    const session = await GameSession.findById(sessionId);
    if (!session || session.score_history.length === 0) return null;

    const lastAction = session.score_history.pop();
    const team = session.teams.find(t => t.id === lastAction.team_id);
    if (team) {
      team.score -= lastAction.delta;
    }

    session.markModified('teams');
    session.markModified('score_history');
    await session.save();
    return { session, undoneAction: lastAction };
  }
}

module.exports = new GameEngine();
