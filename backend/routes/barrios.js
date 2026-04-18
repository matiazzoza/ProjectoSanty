const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const barrioController = require('../controllers/barrioController');

router.use(authMiddleware);

router.get('/', barrioController.getAll);

module.exports = router;
