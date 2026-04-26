const pool = require('../db');

async function getByReporte(reporteId) {
  const [rows] = await pool.query(
    `SELECT a.*, u.nombre AS empleado_nombre
     FROM avances a
     JOIN usuarios u ON a.empleado_id = u.id
     WHERE a.reporte_id = ?
     ORDER BY a.creado_en ASC`,
    [reporteId]
  );
  return rows;
}

async function create(id, { reporteId, empleadoId, descripcion, porcentaje }) {
  await pool.query(
    'INSERT INTO avances (id, reporte_id, empleado_id, descripcion, porcentaje) VALUES (?, ?, ?, ?, ?)',
    [id, reporteId, empleadoId, descripcion, porcentaje ?? null]
  );
  const [rows] = await pool.query(
    `SELECT a.*, u.nombre AS empleado_nombre FROM avances a
     JOIN usuarios u ON a.empleado_id = u.id WHERE a.id = ?`,
    [id]
  );
  return rows[0];
}

module.exports = { getByReporte, create };
