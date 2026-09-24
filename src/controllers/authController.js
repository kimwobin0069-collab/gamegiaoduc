const User = require('../models/User');

exports.getLogin = (req, res) => {
  res.render('auth/login', {
    layout: false,
    title: 'Đăng Nhập - Hệ Thống Trò Chơi Lớp Học',
    error: req.session.loginError || null
  });
  delete req.session.loginError;
};

exports.postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      req.session.loginError = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!';
      return res.redirect('/login');
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      req.session.loginError = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
      return res.redirect('/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.session.loginError = 'Tên đăng nhập hoặc mật khẩu không chính xác!';
      return res.redirect('/login');
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      displayName: user.display_name,
      role: user.role
    };

    const returnTo = req.session.returnTo || '/admin/dashboard';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    req.session.loginError = 'Đã có lỗi xảy ra. Vui lòng thử lại!';
    res.redirect('/login');
  }
};

exports.getLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
