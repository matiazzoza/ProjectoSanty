const router = require('express').Router();
const { authMiddleware, adminMiddleware, empleadoMiddleware } = require('../middleware/auth');
const c = require('../controllers/asignacionController');

// Admin
router.get('/empleados',                      authMiddleware, adminMiddleware,    c.getEmpleados);
router.get('/empleados/estadisticas',         authMiddleware, adminMiddleware,    c.getEstadisticasEmpleados);
router.post('/empleados',                     authMiddleware, adminMiddleware,    c.crearEmpleado);
router.patch('/empleados/:id/toggle',         authMiddleware, adminMiddleware,    c.toggleEmpleado);
router.put('/empleados/:id',                  authMiddleware, adminMiddleware,    c.editarEmpleado);
router.get('/empleados/:id/perfil',           authMiddleware, adminMiddleware,    c.getPerfilEmpleado);
router.post('/asignar',                        authMiddleware, adminMiddleware,    c.asignar);
router.get('/reporte/:reporteId',             authMiddleware, adminMiddleware,    c.getAsignacionesReporte);
router.post('/validar/:reporteId',             authMiddleware, adminMiddleware,    c.validarCierre);
router.post('/rechazar/:reporteId',            authMiddleware, adminMiddleware,    c.rechazarCierre);

// Empleado
router.get('/mi-perfil-empleado',             authMiddleware, empleadoMiddleware, c.getMiPerfilEmpleado);
router.get('/mis-asignaciones',               authMiddleware, empleadoMiddleware, c.getMisAsignaciones);
router.get('/mis-novedades',                  authMiddleware, empleadoMiddleware, c.getMisNovedades);
router.get('/mis-avances',                    authMiddleware, empleadoMiddleware, c.getMisAvances);
router.post('/en-ejecucion/:reporteId',        authMiddleware, empleadoMiddleware, c.marcarEnEjecucion);
router.post('/proponer-cierre/:reporteId',     authMiddleware, empleadoMiddleware, c.proponerCierre);

module.exports = router;
