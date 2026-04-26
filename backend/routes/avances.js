const router = require('express').Router();
const { authMiddleware, adminMiddleware, empleadoMiddleware } = require('../middleware/auth');
const c = require('../controllers/avanceController');

router.get('/reporte/:reporteId',    authMiddleware,                    c.getAvances);
router.post('/reporte/:reporteId',   authMiddleware, empleadoMiddleware, c.registrarAvance);

module.exports = router;
