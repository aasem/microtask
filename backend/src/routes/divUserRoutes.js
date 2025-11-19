const express = require('express');
const router = express.Router();
const divUserController = require('../controllers/divUserController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, divUserController.getAllDivUsers);
router.get('/:id', authenticateToken, divUserController.getDivUserById);
router.post('/', authenticateToken, divUserController.createDivUser);
router.put('/:id', authenticateToken, divUserController.updateDivUser);
router.delete('/:id', authenticateToken, divUserController.deleteDivUser);

module.exports = router;

