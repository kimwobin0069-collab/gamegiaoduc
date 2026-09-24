const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middlewares/auth');

router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/login');
});

router.get('/admin/dashboard', requireAuth, adminController.getDashboard);
router.get('/admin/games', requireAuth, adminController.getGames);

module.exports = router;
