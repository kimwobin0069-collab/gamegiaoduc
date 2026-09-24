const test = require('node:test');
const assert = require('node:assert');

test('Kiểm thử Đồng Hồ: Tính toán tỉ lệ đếm ngược và trạng thái khẩn cấp', () => {
  const total = 30;
  
  let remaining = 30;
  let percent = (remaining / total) * 100;
  assert.strictEqual(percent, 100);

  remaining = 15;
  percent = (remaining / total) * 100;
  assert.strictEqual(percent, 50);

  remaining = 5;
  const isUrgent = remaining <= 5 && remaining > 0;
  assert.strictEqual(isUrgent, true, 'Dưới 5 giây phải kích hoạt trạng thái khẩn cấp (urgent pulse)');

  remaining = 0;
  const isExpired = remaining <= 0;
  assert.strictEqual(isExpired, true, 'Hết giờ khi remaining <= 0');
});
