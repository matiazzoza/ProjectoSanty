const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Limita intentos de login por IP para frenar fuerza bruta de contraseñas
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo en unos minutos.' },
});

// login y register son públicos (sin middleware)
router.post('/login', loginLimiter, authController.login);
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
