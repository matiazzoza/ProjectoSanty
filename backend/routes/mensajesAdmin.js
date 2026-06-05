const router = require('express').Router();
const { authMiddleware, adminMiddleware, empleadoMiddleware } = require('../middleware/auth');
const c = require('../controllers/mensajeAdminController');

router.post('/',                authMiddleware, empleadoMiddleware, c.enviarMensaje);
router.get('/mis-mensajes',     authMiddleware, empleadoMiddleware, c.getMisMensajes);
router.get('/',                 authMiddleware, adminMiddleware,    c.getMensajes);
router.patch('/:id/leido',      authMiddleware, adminMiddleware,    c.marcarLeido);

module.exports = router;
