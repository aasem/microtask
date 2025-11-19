const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticateToken } = require('../middleware/auth');

// Upload endpoints
router.post('/task', authenticateToken, fileController.upload.single('file'), fileController.uploadTaskFile);
router.post('/subtask', authenticateToken, fileController.upload.single('file'), fileController.uploadSubtaskFile);

// Get files endpoints
router.get('/task/:taskId', authenticateToken, fileController.getTaskFiles);
router.get('/subtask/:subtaskId', authenticateToken, fileController.getSubtaskFiles);

// Download and delete endpoints
router.get('/:fileId/download', authenticateToken, fileController.downloadFile);
router.delete('/:fileId', authenticateToken, fileController.deleteFile);

module.exports = router;

