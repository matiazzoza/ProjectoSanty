const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const authController = require('../controllers/authController');

// login y register son públicos (sin middleware)
router.post('/login', authController.login);
router.post('/register', authController.register);

// updateProfile requiere estar autenticado
router.put('/profile/:id', authMiddleware, authController.updateProfile);

module.exports = router;
