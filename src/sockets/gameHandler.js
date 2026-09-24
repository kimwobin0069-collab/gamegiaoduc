const GameSession = require('../models/GameSession');
const Question = require('../models/Question');
const gameEngine = require('../services/gameEngine');

// Quản lý active timers trên RAM
const activeTimers = new Map();

function setupGameHandlers(io, socket) {
  // 1. Màn hình máy chiếu tham gia phòng
  socket.on('JOIN_DISPLAY', async ({ sessionCode }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionCode);
      if (!data || !data.session) {
        return socket.emit('ERROR', { message: 'Mã phòng không tồn tại.' });
      }

      const roomName = `room_${data.session._id}`;
      socket.join(roomName);
      socket.sessionId = data.session._id.toString();
      socket.isDisplay = true;

      // Gửi trạng thái đã được khử thông tin bí mật
      const sanitized = gameEngine.sanitizeForProjector(data.session, data.questions);
      socket.emit('INIT_DISPLAY_STATE', sanitized);
      console.log(`[Socket] Projector đã kết nối vào phòng ${data.session.session_code}`);
    } catch (err) {
      console.error('Lỗi JOIN_DISPLAY:', err);
    }
  });

  // 2. Màn hình điều khiển GV tham gia phòng
  socket.on('JOIN_HOST', async ({ sessionId }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionId);
      if (!data || !data.session) {
        return socket.emit('ERROR', { message: 'Phiên trò chơi không tồn tại.' });
      }

      const roomName = `room_${data.session._id}`;
      socket.join(roomName);
      socket.sessionId = data.session._id.toString();
      socket.isHost = true;

      // Gửi đầy đủ thông tin cho host
      socket.emit('INIT_HOST_STATE', {
        session: data.session,
        questions: data.questions,
        currentQuestion: data.currentQuestion
      });
      console.log(`[Socket] Host điều khiển đã kết nối vào phiên ${sessionId}`);
    } catch (err) {
      console.error('Lỗi JOIN_HOST:', err);
    }
  });

  // 3. Điều khiển Đồng hồ đếm ngược
  socket.on('START_TIMER', async ({ sessionId, seconds }) => {
    const roomName = `room_${sessionId}`;
    // Hủy timer cũ nếu đang chạy
    if (activeTimers.has(sessionId)) {
      clearInterval(activeTimers.get(sessionId));
    }

    const session = await GameSession.findById(sessionId);
    if (!session) return;

    let remaining = Number(seconds) || session.settings.time_limit || 30;
    const total = remaining;
    session.current_state.timer = { running: true, remaining, total };
    session.markModified('current_state');
    await session.save();

    io.to(roomName).emit('TIMER_START', { remaining, total });

    const interval = setInterval(async () => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(interval);
        activeTimers.delete(sessionId);
        
        const curSession = await GameSession.findById(sessionId);
        if (curSession) {
          curSession.current_state.timer.running = false;
          curSession.current_state.timer.remaining = 0;
          curSession.markModified('current_state');
          await curSession.save();
        }

        io.to(roomName).emit('TIMER_EXPIRED');
      } else {
        io.to(roomName).emit('TIMER_TICK', { remaining, total });
      }
    }, 1000);

    activeTimers.set(sessionId, interval);
  });

  socket.on('PAUSE_TIMER', async ({ sessionId }) => {
    if (activeTimers.has(sessionId)) {
      clearInterval(activeTimers.get(sessionId));
      activeTimers.delete(sessionId);
    }
    const session = await GameSession.findById(sessionId);
    if (session) {
      session.current_state.timer.running = false;
      session.markModified('current_state');
      await session.save();
    }
    io.to(`room_${sessionId}`).emit('TIMER_PAUSED');
  });

  socket.on('RESET_TIMER', async ({ sessionId, seconds }) => {
    if (activeTimers.has(sessionId)) {
      clearInterval(activeTimers.get(sessionId));
      activeTimers.delete(sessionId);
    }
    const session = await GameSession.findById(sessionId);
    if (session) {
      const total = Number(seconds) || session.settings.time_limit || 30;
      session.current_state.timer = { running: false, remaining: total, total };
      session.markModified('current_state');
      await session.save();
      io.to(`room_${sessionId}`).emit('TIMER_RESET', { total });
    }
  });

  // 4. Chuyển đổi câu hỏi
  socket.on('CHANGE_QUESTION', async ({ sessionId, index }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionId);
      if (!data || !data.session) return;

      const newIndex = Math.max(0, Math.min(data.questions.length - 1, Number(index)));
      data.session.current_question_index = newIndex;
      
      // Reset trạng thái câu hỏi
      data.session.current_state.is_question_visible = true;
      data.session.current_state.is_answer_revealed = false;
      data.session.current_state.is_locked = false;
      data.session.current_state.selected_answer = null;
      data.session.current_state.lifelines_used = [];

      data.session.markModified('current_state');
      await data.session.save();

      // Dừng timer hiện tại nếu có
      if (activeTimers.has(sessionId)) {
        clearInterval(activeTimers.get(sessionId));
        activeTimers.delete(sessionId);
      }

      const roomName = `room_${sessionId}`;
      // Gửi sanitized sang display
      const sanitized = gameEngine.sanitizeForProjector(data.session, data.questions);
      io.to(roomName).emit('QUESTION_CHANGED_DISPLAY', sanitized);

      // Gửi full sang host
      io.to(roomName).emit('QUESTION_CHANGED_HOST', {
        currentQuestionIndex: newIndex,
        currentQuestion: data.questions[newIndex],
        session: data.session
      });
    } catch (err) {
      console.error('Lỗi CHANGE_QUESTION:', err);
    }
  });

  // 5. Khóa câu trả lời (Chốt đáp án)
  socket.on('LOCK_ANSWER', async ({ sessionId, selectedAnswer }) => {
    const session = await GameSession.findById(sessionId);
    if (!session) return;

    session.current_state.is_locked = true;
    session.current_state.selected_answer = selectedAnswer;
    session.markModified('current_state');
    await session.save();

    io.to(`room_${sessionId}`).emit('ANSWER_LOCKED', { selectedAnswer });
  });

  // 6. Công bố đáp án
  socket.on('REVEAL_ANSWER', async ({ sessionId }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionId);
      if (!data || !data.session) return;

      data.session.current_state.is_answer_revealed = true;
      data.session.markModified('current_state');
      await data.session.save();

      const q = data.currentQuestion;
      const payload = {
        correctAnswer: q?.data?.correct_answer || q?.data?.answer || '',
        explanation: q?.data?.explanation || '',
        selectedAnswer: data.session.current_state.selected_answer
      };

      io.to(`room_${sessionId}`).emit('ANSWER_REVEALED', payload);
    } catch (err) {
      console.error('Lỗi REVEAL_ANSWER:', err);
    }
  });

  // 7. Quyền trợ giúp (Ai là triệu phú)
  socket.on('TRIGGER_LIFELINE', async ({ sessionId, lifeline }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionId);
      if (!data || !data.session) return;

      const q = data.currentQuestion;
      const roomName = `room_${sessionId}`;

      if (lifeline === '50:50') {
        const correct = (q?.data?.correct_answer || 'A').toUpperCase();
        const options = ['A', 'B', 'C', 'D'].filter(opt => opt !== correct);
        // Trộn ngẫu nhiên và lấy 2 phương án sai để ẩn
        const shuffled = options.sort(() => 0.5 - Math.random());
        const hiddenOptions = [shuffled[0], shuffled[1]];

        io.to(roomName).emit('LIFELINE_APPLIED', {
          lifeline: '50:50',
          hiddenOptions
        });
      } else if (lifeline === 'ask_class') {
        const correct = (q?.data?.correct_answer || 'A').toUpperCase();
        // Giả lập tỉ lệ phần trăm hợp lý
        const poll = { A: 10, B: 10, C: 10, D: 10 };
        poll[correct] = 55;
        const remainder = 45;
        const others = ['A', 'B', 'C', 'D'].filter(o => o !== correct);
        poll[others[0]] = 20;
        poll[others[1]] = 15;
        poll[others[2]] = 10;

        io.to(roomName).emit('LIFELINE_APPLIED', {
          lifeline: 'ask_class',
          poll
        });
      } else if (lifeline === 'teacher_hint') {
        io.to(roomName).emit('LIFELINE_APPLIED', {
          lifeline: 'teacher_hint',
          hint: q?.data?.explanation || 'Hãy chú ý đến các từ khóa trong câu hỏi!'
        });
      }
    } catch (err) {
      console.error('Lỗi TRIGGER_LIFELINE:', err);
    }
  });

  // 8. Quay nón kỳ diệu
  socket.on('SPIN_WHEEL', async ({ sessionId, targetSectorIndex }) => {
    const session = await GameSession.findById(sessionId);
    if (!session) return;

    io.to(`room_${sessionId}`).emit('WHEEL_SPIN_START', {
      targetSectorIndex: Number(targetSectorIndex) || 0
    });
  });

  // 9. Lật mở chữ cái (Chiếc nón kỳ diệu)
  socket.on('REVEAL_LETTER', async ({ sessionId, letter }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionId);
      if (!data || !data.session) return;

      const keyword = (data.currentQuestion?.data?.keyword || '').toUpperCase();
      const normLetter = letter.toUpperCase();
      const charArray = keyword.replace(/\s+/g, '').split('');

      const matchIndices = [];
      charArray.forEach((ch, idx) => {
        if (ch === normLetter) matchIndices.push(idx);
      });

      const isCorrect = matchIndices.length > 0;
      io.to(`room_${sessionId}`).emit('LETTER_REVEALED', {
        letter: normLetter,
        isCorrect,
        matchIndices,
        count: matchIndices.length
      });
    } catch (err) {
      console.error('Lỗi REVEAL_LETTER:', err);
    }
  });

  // 10. Lật mở mảnh ghép (Vượt chướng ngại vật)
  socket.on('REVEAL_PUZZLE_PIECE', async ({ sessionId, pieceIndex }) => {
    io.to(`room_${sessionId}`).emit('PUZZLE_PIECE_REVEALED', {
      pieceIndex: Number(pieceIndex)
    });
  });

  socket.on('REVEAL_FULL_PUZZLE', async ({ sessionId }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionId);
      const secretImg = data?.currentQuestion?.data?.image || '';
      io.to(`room_${sessionId}`).emit('FULL_PUZZLE_REVEALED', { image: secretImg });
    } catch (err) {
      console.error('Lỗi REVEAL_FULL_PUZZLE:', err);
    }
  });

  // 11. Ô chữ bí mật
  socket.on('REVEAL_CROSSWORD_ROW', async ({ sessionId, rowNumber }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionId);
      const q = data.questions.find((_, idx) => (idx + 1) === Number(rowNumber));
      const answer = (q?.data?.answer || '').toUpperCase();

      io.to(`room_${sessionId}`).emit('CROSSWORD_ROW_REVEALED', {
        rowNumber: Number(rowNumber),
        answer
      });
    } catch (err) {
      console.error('Lỗi REVEAL_CROSSWORD_ROW:', err);
    }
  });

  socket.on('REVEAL_CROSSWORD_KEYWORD', async ({ sessionId }) => {
    io.to(`room_${sessionId}`).emit('CROSSWORD_KEYWORD_REVEALED');
  });

  // 12. Hãy chọn giá đúng
  socket.on('SUBMIT_PRICE_GUESSES', async ({ sessionId, guesses }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionId);
      if (!data || !data.session) return;

      const actualPrice = Number(data.currentQuestion?.data?.correct_price) || 0;
      const strictRule = data.session.settings.strict_price;

      let closestTeamId = null;
      let minDiff = Infinity;

      for (const [teamId, priceVal] of Object.entries(guesses)) {
        const val = Number(priceVal);
        if (isNaN(val)) continue;

        if (strictRule && val > actualPrice) continue;

        const diff = Math.abs(actualPrice - val);
        if (diff < minDiff) {
          minDiff = diff;
          closestTeamId = teamId;
        }
      }

      io.to(`room_${sessionId}`).emit('PRICE_GUESSES_EVALUATED', {
        guesses,
        closestTeamId
      });
    } catch (err) {
      console.error('Lỗi SUBMIT_PRICE_GUESSES:', err);
    }
  });

  socket.on('REVEAL_ACTUAL_PRICE', async ({ sessionId }) => {
    try {
      const data = await gameEngine.getSessionWithQuestions(sessionId);
      const price = Number(data.currentQuestion?.data?.correct_price) || 0;
      io.to(`room_${sessionId}`).emit('ACTUAL_PRICE_REVEALED', { actualPrice: price });
    } catch (err) {
      console.error('Lỗi REVEAL_ACTUAL_PRICE:', err);
    }
  });

  // 13. Điều chỉnh và Hoàn tác điểm số
  socket.on('ADJUST_SCORE', async ({ sessionId, teamId, delta, reason }) => {
    try {
      const session = await gameEngine.adjustScore(sessionId, teamId, delta, reason);
      if (session) {
        io.to(`room_${sessionId}`).emit('SCORE_UPDATED', {
          teams: session.teams,
          history: session.score_history
        });
      }
    } catch (err) {
      console.error('Lỗi ADJUST_SCORE:', err);
    }
  });

  socket.on('UNDO_SCORE', async ({ sessionId }) => {
    try {
      const result = await gameEngine.undoScore(sessionId);
      if (result && result.session) {
        io.to(`room_${sessionId}`).emit('SCORE_UPDATED', {
          teams: result.session.teams,
          history: result.session.score_history,
          undoneAction: result.undoneAction
        });
      }
    } catch (err) {
      console.error('Lỗi UNDO_SCORE:', err);
    }
  });

  // 14. Kết thúc phiên chơi
  socket.on('END_GAME', async ({ sessionId }) => {
    try {
      const session = await GameSession.findById(sessionId);
      if (session) {
        session.status = 'ended';
        session.ended_at = new Date();
        await session.save();

        io.to(`room_${sessionId}`).emit('GAME_ENDED', {
          summaryUrl: `/admin/sessions/${sessionId}/summary`
        });
      }
    } catch (err) {
      console.error('Lỗi END_GAME:', err);
    }
  });

  socket.on('disconnect', () => {
    // Ngắt kết nối socket
  });
}

module.exports = setupGameHandlers;
