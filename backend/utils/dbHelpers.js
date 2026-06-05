const pool = require('../db');

async function getReporteTitulo(reporteId) {
  const [[row]] = await pool.query('SELECT titulo FROM reportes WHERE id = ?', [reporteId]);
  return row?.titulo ?? null;
}

async function getUserNombre(userId) {
  const [[row]] = await pool.query('SELECT nombre FROM usuarios WHERE id = ?', [userId]);
  return row?.nombre ?? null;
}

async function getAdminIds() {
  const [rows] = await pool.query("SELECT id FROM usuarios WHERE rol = 'admin'");
  return rows;
}

async function getAdminYSuperadminIds() {
  const [rows] = await pool.query("SELECT id FROM usuarios WHERE rol IN ('admin','superadmin')");
  return rows;
}

async function validarAsignacionActiva(reporteId, empleadoId) {
  const [rows] = await pool.query(
    "SELECT id FROM asignaciones WHERE reporte_id = ? AND empleado_id = ? AND activo = 1 AND aprobado = 'aprobado'",
    [reporteId, empleadoId]
  );
  return rows.length > 0;
}

async function validarLider(reporteId, empleadoId) {
  const [rows] = await pool.query(
    "SELECT id FROM asignaciones WHERE reporte_id = ? AND empleado_id = ? AND es_lider = 1 AND activo = 1 AND aprobado = 'aprobado'",
    [reporteId, empleadoId]
  );
  return rows.length > 0;
}

module.exports = {
  getReporteTitulo,
  getUserNombre,
  getAdminIds,
  getAdminYSuperadminIds,
  validarAsignacionActiva,
  validarLider,
};
