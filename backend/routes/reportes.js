const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const reporteController = require('../controllers/reporteController');
const votoController = require('../controllers/votoController');
const comentarioController = require('../controllers/comentarioController');
const seguimientoController = require('../controllers/seguimientoController');
const HistorialEstado = require('../models/HistorialEstado');

router.get('/stats', reporteController.getEstadisticasPublicas);

router.use(authMiddleware);

router.get('/',    reporteController.getAll);
router.get('/:id', reporteController.getOne);
router.post('/',   reporteController.create);
router.put('/:id', reporteController.update);
router.delete('/:id', reporteController.remove);

router.post('/:id/vote', votoController.toggle);
router.post('/:id/seguir', seguimientoController.toggle);

router.post('/:id/comments', comentarioController.create);
router.delete('/:reportId/comments/:commentId', comentarioController.remove);

router.get('/:id/historial', async (req, res) => {
  try {
    const historial = await HistorialEstado.getByReporte(req.params.id);
    res.json(historial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
