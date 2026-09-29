require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const reporteRoutes = require('./routes/reportes');
const notificacionRoutes = require('./routes/notificaciones');
const barrioRoutes = require('./routes/barrios');
const seguimientoRoutes = require('./routes/seguimientos');
const asignacionRoutes = require('./routes/asignaciones');
const novedadRoutes = require('./routes/novedades');
const avanceRoutes = require('./routes/avances');
const usuarioRoutes = require('./routes/usuarios');
const superAdminRoutes = require('./routes/superAdmin');
const mensajesAdminRoutes = require('./routes/mensajesAdmin');
const abandonoJob = require('./jobs/abandonoJob');
const vencimientoJob = require('./jobs/vencimientoJob');
const verificacionJob = require('./jobs/verificacionJob');

// Orígenes permitidos: localhost/127.0.0.1 en cualquier puerto (dev web), la IP LAN de esta
// máquina (por si se abre la web desde otro dispositivo), y lo que se sume por env en producción.
const ALLOWED_ORIGIN_PATTERNS = [/^https?:\/\/localhost(:\d+)?$/, /^https?:\/\/127\.0\.0\.1(:\d+)?$/, /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/];
const EXTRA_ORIGINS = (process.env.FRONTEND_URL || '').split(',').map((o) => o.trim()).filter(Boolean);

const app = express();
app.use(cors({
  origin(origin, callback) {
    // Sin header Origin (apps móviles, curl, Postman) no aplica CORS: se deja pasar.
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin)) || EXTRA_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
}));
app.use(express.json({ limit: '10mb' }));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reports', reporteRoutes);
app.use('/api/notifications', notificacionRoutes);
app.use('/api/barrios', barrioRoutes);
app.use('/api/seguimientos', seguimientoRoutes);
app.use('/api/asignaciones', asignacionRoutes);
app.use('/api/novedades', novedadRoutes);
app.use('/api/avances', avanceRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/mensajes-admin', mensajesAdminRoutes);

// ─── Jobs ─────────────────────────────────────────────────────────────────────
abandonoJob.iniciar();
vencimientoJob.iniciar();
verificacionJob.iniciar();

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
