const router = require('express').Router();
const { authMiddleware, adminMiddleware, empleadoMiddleware } = require('../middleware/auth');
const c = require('../controllers/novedadController');

router.get('/',                            authMiddleware, adminMiddleware,    c.getAllNovedades);
router.get('/reporte/:reporteId',          authMiddleware,                  c.getNovedades);
router.post('/reporte/:reporteId',         authMiddleware, empleadoMiddleware, c.cargarNovedad);
router.post('/responder/:novedadId',       authMiddleware, adminMiddleware,    c.responderNovedad);

module.exports = router;
