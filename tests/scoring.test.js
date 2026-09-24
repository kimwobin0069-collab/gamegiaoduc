const test = require('node:test');
const assert = require('node:assert');

test('Kiểm thử Tính Điểm: Tăng tốc chia điểm theo thứ hạng thời gian', () => {
  const ladder = [40, 30, 20, 10];
  const submissions = [
    { teamId: 'team_1', timeTaken: 2.35, isCorrect: true },
    { teamId: 'team_2', timeTaken: 3.12, isCorrect: true },
    { teamId: 'team_3', timeTaken: 4.50, isCorrect: false },
    { teamId: 'team_4', timeTaken: 5.01, isCorrect: true }
  ];

  // Lọc đúng và sắp xếp theo thời gian tăng dần
  const correctOnes = submissions.filter(s => s.isCorrect).sort((a, b) => a.timeTaken - b.timeTaken);

  const awarded = correctOnes.map((s, idx) => ({
    teamId: s.teamId,
    points: ladder[idx] || 0
  }));

  assert.strictEqual(awarded[0].teamId, 'team_1');
  assert.strictEqual(awarded[0].points, 40, 'Nhanh nhất đạt 40 điểm');

  assert.strictEqual(awarded[1].teamId, 'team_2');
  assert.strictEqual(awarded[1].points, 30, 'Nhanh nhì đạt 30 điểm');

  assert.strictEqual(awarded[2].teamId, 'team_4');
  assert.strictEqual(awarded[2].points, 20, 'Nhanh ba đạt 20 điểm');
});

test('Kiểm thử Tính Điểm: Hoàn tác (Undo) thao tác cộng điểm', () => {
  const team = { id: 'team_1', score: 100 };
  const history = [];

  // Thao tác 1: Cộng 40 điểm
  const action1 = { teamId: 'team_1', delta: 40 };
  team.score += action1.delta;
  history.push(action1);
  assert.strictEqual(team.score, 140);

  // Thao tác 2: Trừ 10 điểm
  const action2 = { teamId: 'team_1', delta: -10 };
  team.score += action2.delta;
  history.push(action2);
  assert.strictEqual(team.score, 130);

  // Undo thao tác 2
  const lastAction = history.pop();
  team.score -= lastAction.delta;
  assert.strictEqual(team.score, 140, 'Sau khi Undo, điểm phải phục hồi về 140');

  // Undo thao tác 1
  const firstAction = history.pop();
  team.score -= firstAction.delta;
  assert.strictEqual(team.score, 100, 'Sau khi Undo lần 2, điểm phải về 100 ban đầu');
});
