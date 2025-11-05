const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, tagController.getAllTags);
router.post('/', authenticateToken, tagController.createTag);
router.delete('/:id', authenticateToken, tagController.deleteTag);

module.exports = router;
