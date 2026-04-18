const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const reporteRoutes = require('./routes/reportes');
const notificacionRoutes = require('./routes/notificaciones');
const barrioRoutes = require('./routes/barrios');
const seguimientoRoutes = require('./routes/seguimientos');
const asignacionRoutes = require('./routes/asignaciones');
const novedadRoutes = require('./routes/novedades');
const vencimientoJob = require('./jobs/vencimientoJob');
const abandonoJob = require('./jobs/abandonoJob');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reports', reporteRoutes);
app.use('/api/notifications', notificacionRoutes);
app.use('/api/barrios', barrioRoutes);
app.use('/api/seguimientos', seguimientoRoutes);
app.use('/api/asignaciones', asignacionRoutes);
app.use('/api/novedades', novedadRoutes);

// ─── Jobs ─────────────────────────────────────────────────────────────────────
vencimientoJob.iniciar();
abandonoJob.iniciar();

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
