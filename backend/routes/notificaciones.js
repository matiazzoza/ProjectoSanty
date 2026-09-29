const router = require('express').Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const notificacionController = require('../controllers/notificacionController');

router.use(authMiddleware);

// Rutas fijas primero para evitar conflicto con /:userId
router.post('/alerta', adminMiddleware, notificacionController.crearAlerta);
router.get('/:userId', notificacionController.getAll);
router.put('/:id/leida', notificacionController.marcarLeida);

module.exports = router;
