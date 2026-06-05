const router = require('express').Router();
const { authMiddleware, adminMiddleware, superadminMiddleware } = require('../middleware/auth');
const c = require('../controllers/usuarioController');

router.get('/',                        authMiddleware, superadminMiddleware, c.getAll);
router.post('/',                       authMiddleware, superadminMiddleware, c.create);
router.put('/:id',                     authMiddleware, superadminMiddleware, c.update);
router.delete('/:id',                  authMiddleware, superadminMiddleware, c.remove);
router.get('/:id/especialidades',      authMiddleware, adminMiddleware, c.getEspecialidades);
router.put('/:id/especialidades',      authMiddleware, adminMiddleware, c.setEspecialidades);

module.exports = router;
