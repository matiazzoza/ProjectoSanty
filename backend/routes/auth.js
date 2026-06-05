const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const authController = require('../controllers/authController');

// login y register son públicos (sin middleware)
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/verificar/:token', authController.verificarEmail);
router.post('/reenviar-verificacion', authController.reenviarVerificacion);
router.post('/recuperar-contrasena', authController.solicitarRecuperacion);
router.post('/nueva-contrasena/:token', authController.confirmarRecuperacion);

// updateProfile requiere estar autenticado
router.put('/profile/:id', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.cambiarContrasena);
router.post('/reset-for-user/:userId', authMiddleware, adminMiddleware, authController.triggerPasswordReset);

module.exports = router;
