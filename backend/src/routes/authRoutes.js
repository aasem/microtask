const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/register', authenticateToken, authorizeRoles('admin'), authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;
