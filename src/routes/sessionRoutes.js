const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { requireAuth } = require('../middlewares/auth');

router.get('/admin/sessions/create', requireAuth, sessionController.getCreateSession);
router.post('/admin/sessions/create', requireAuth, sessionController.postCreateSession);
router.get('/admin/sessions/:id/controller', requireAuth, sessionController.getController);
router.get('/admin/sessions/:id/summary', requireAuth, sessionController.getSummary);

module.exports = router;
