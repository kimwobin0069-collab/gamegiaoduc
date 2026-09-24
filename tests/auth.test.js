const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');

test('Kiểm thử Auth: Băm và so khớp mật khẩu quản trị viên', async () => {
  const plainPassword = 'Admin@123456';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);

  assert.ok(hash !== plainPassword, 'Mật khẩu phải được băm, không lưu dạng plain-text');
  
  const isMatchCorrect = await bcrypt.compare(plainPassword, hash);
  assert.strictEqual(isMatchCorrect, true, 'Mật khẩu đúng phải xác thực thành công');

  const isMatchWrong = await bcrypt.compare('WrongPassword', hash);
  assert.strictEqual(isMatchWrong, false, 'Mật khẩu sai phải bị từ chối');
});
