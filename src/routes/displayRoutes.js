const express = require('express');
const router = express.Router();
const displayController = require('../controllers/displayController');

// Màn hình máy chiếu toàn màn hình (không cần đăng nhập tài khoản quản trị)
router.get('/display/:code', displayController.getProjector);
router.get('/projector/:code', displayController.getProjector);

module.exports = router;
