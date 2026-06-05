const router = require('express').Router();
const { authMiddleware, adminMiddleware, superadminMiddleware } = require('../middleware/auth');
const c = require('../controllers/superAdminController');

router.get('/dashboard',         authMiddleware, superadminMiddleware, c.getDashboard);
router.get('/mi-perfil',         authMiddleware, adminMiddleware,      c.getMiPerfilAdmin);
router.get('/admin/:id/perfil',  authMiddleware, superadminMiddleware, c.getPerfilAdmin);

module.exports = router;
