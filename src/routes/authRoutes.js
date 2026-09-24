const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireGuest } = require('../middlewares/auth');

router.get('/login', requireGuest, authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.getLogout);

module.exports = router;
