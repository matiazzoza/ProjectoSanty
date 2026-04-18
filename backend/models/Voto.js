const pool = require('../db');

async function exists(reporteId, usuarioId) {
  const [rows] = await pool.query(
    'SELECT 1 FROM votos WHERE reporte_id = ? AND usuario_id = ?',
    [reporteId, usuarioId]
  );
  return rows.length > 0;
}

async function add(reporteId, usuarioId) {
  await pool.query('INSERT INTO votos (reporte_id, usuario_id) VALUES (?, ?)', [reporteId, usuarioId]);
}

async function remove(reporteId, usuarioId) {
  await pool.query('DELETE FROM votos WHERE reporte_id = ? AND usuario_id = ?', [reporteId, usuarioId]);
}

async function getByReporte(reporteId) {
  const [rows] = await pool.query('SELECT usuario_id FROM votos WHERE reporte_id = ?', [reporteId]);
  return rows.map((r) => r.usuario_id);
}

module.exports = { exists, add, remove, getByReporte };
