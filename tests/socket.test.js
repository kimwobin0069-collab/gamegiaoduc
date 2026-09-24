const test = require('node:test');
const assert = require('node:assert');
const gameEngine = require('../src/services/gameEngine');

test('Kiểm thử Bảo Mật Socket.IO: Không để lộ đáp án đúng sang Màn hình trình chiếu trước khi công bố', () => {
  const fakeSession = {
    session_code: 'TEST88',
    game_type_code: 'millionaire',
    status: 'playing',
    current_question_index: 0,
    teams: [{ id: 'team_1', name: 'Đội Đỏ', score: 0 }],
    settings: { time_limit: 30 },
    current_state: {
      is_question_visible: true,
      is_answer_revealed: false // Chưa công bố
    }
  };

  const fakeQuestions = [
    {
      question_text: 'Câu hỏi bí mật',
      data: {
        option_a: 'A',
        option_b: 'B',
        option_c: 'C',
        option_d: 'D',
        correct_answer: 'B', // ĐÁP ÁN BÍ MẬT
        explanation: 'Giải thích bí mật'
      }
    }
  ];

  const sanitized = gameEngine.sanitizeForProjector(fakeSession, fakeQuestions);

  assert.ok(sanitized.currentQuestion, 'Câu hỏi vẫn phải được gửi để trình chiếu');
  assert.strictEqual(sanitized.currentQuestion.question_text, 'Câu hỏi bí mật');
  assert.strictEqual(sanitized.currentQuestion.data.correct_answer, undefined, 'BẢO MẬT: correct_answer phải bị xóa sạch khỏi payload');
  assert.strictEqual(sanitized.currentQuestion.data.explanation, undefined, 'BẢO MẬT: explanation phải bị xóa sạch khỏi payload');
});

test('Kiểm thử Bảo Mật Socket.IO: Cho phép gửi đáp án sau khi giáo viên đã công bố', () => {
  const fakeSession = {
    session_code: 'TEST88',
    game_type_code: 'millionaire',
    status: 'playing',
    current_question_index: 0,
    teams: [{ id: 'team_1', name: 'Đội Đỏ', score: 0 }],
    settings: { time_limit: 30 },
    current_state: {
      is_question_visible: true,
      is_answer_revealed: true // ĐÃ CÔNG BỐ
    }
  };

  const fakeQuestions = [
    {
      question_text: 'Câu hỏi bí mật',
      data: {
        option_a: 'A',
        option_b: 'B',
        option_c: 'C',
        option_d: 'D',
        correct_answer: 'B',
        explanation: 'Giải thích bí mật'
      }
    }
  ];

  const sanitized = gameEngine.sanitizeForProjector(fakeSession, fakeQuestions);
  assert.strictEqual(sanitized.currentQuestion.data.correct_answer, 'B', 'Khi đã công bố, đáp án được phép hiển thị');
});
