const router = require('express').Router();
const { authMiddleware, adminMiddleware, empleadoMiddleware } = require('../middleware/auth');
const c = require('../controllers/asignacionController');

// Admin
router.get('/empleados',                      authMiddleware, adminMiddleware,    c.getEmpleados);
router.post('/asignar',                        authMiddleware, adminMiddleware,    c.asignar);
router.get('/reporte/:reporteId',             authMiddleware, adminMiddleware,    c.getAsignacionesReporte);
router.post('/validar/:reporteId',             authMiddleware, adminMiddleware,    c.validarCierre);
router.post('/rechazar/:reporteId',            authMiddleware, adminMiddleware,    c.rechazarCierre);

// Empleado
router.get('/mis-asignaciones',               authMiddleware, empleadoMiddleware, c.getMisAsignaciones);
router.post('/en-ejecucion/:reporteId',        authMiddleware, empleadoMiddleware, c.marcarEnEjecucion);
router.post('/proponer-cierre/:reporteId',     authMiddleware, empleadoMiddleware, c.proponerCierre);

module.exports = router;
