const jwt = require('jsonwebtoken');

const SECRET = 'reportamuni_secret_key_2026';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Solo el admin puede hacer esto.' });
  next();
}

function empleadoMiddleware(req, res, next) {
  if (req.user?.role !== 'empleado') return res.status(403).json({ error: 'Solo los empleados pueden hacer esto.' });
  next();
}

module.exports = { authMiddleware, adminMiddleware, empleadoMiddleware, SECRET };
