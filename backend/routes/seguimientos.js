const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const seguimientoController = require('../controllers/seguimientoController');

router.use(authMiddleware);

router.get('/:userId', seguimientoController.getByUsuario);

module.exports = router;
