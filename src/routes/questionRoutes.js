const express = require('express');
const router = express.Router();
const questionSetController = require('../controllers/questionSetController');
const questionController = require('../controllers/questionController');
const templateController = require('../controllers/templateController');
const { requireAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Quản lý Bộ câu hỏi
router.get('/admin/question-sets', requireAuth, questionSetController.getQuestionSets);
router.post('/admin/question-sets', requireAuth, questionSetController.postCreateSet);
router.post('/admin/question-sets/:id/duplicate', requireAuth, questionSetController.postDuplicateSet);
router.get('/admin/question-sets/:id/export', requireAuth, questionSetController.getExportSet);
router.post('/admin/question-sets/:id/delete', requireAuth, questionSetController.postDeleteSet);
router.post('/admin/question-sets/bulk-delete', requireAuth, questionSetController.postBulkDeleteQuestions);

// Nhập câu hỏi thủ công
router.get('/admin/questions/create', requireAuth, questionController.getCreateQuestion);
router.post('/admin/questions/create', requireAuth, questionController.postCreateQuestion);
router.post('/admin/questions/:id/delete', requireAuth, questionController.postDeleteQuestion);

// Import câu hỏi
router.get('/admin/questions/import', requireAuth, questionController.getImport);
router.post('/admin/questions/import', requireAuth, upload.single('file'), questionController.postUploadImport);
router.get('/admin/questions/preview-import', requireAuth, questionController.getPreviewImport);
router.get('/admin/questions/download-error-report', requireAuth, questionController.getDownloadErrorReport);
router.post('/admin/questions/save-import', requireAuth, questionController.postSaveImport);

// File mẫu
router.get('/admin/templates', requireAuth, templateController.getTemplates);
router.get('/admin/templates/download/:gameType', requireAuth, templateController.downloadTemplate);

module.exports = router;
