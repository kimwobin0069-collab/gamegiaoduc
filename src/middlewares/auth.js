/**
 * Middleware Xác thực Quản trị viên
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/login');
};

const requireGuest = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  return next();
};

const setLocals = (req, res, next) => {
  res.locals.currentUser = req.session ? req.session.user : null;
  res.locals.currentUrl = req.originalUrl;
  next();
};

module.exports = {
  requireAuth,
  requireGuest,
  setLocals
};
