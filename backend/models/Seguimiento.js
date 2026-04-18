const pool = require('../db');

async function exists(usuarioId, reporteId) {
  const [rows] = await pool.query(
    'SELECT 1 FROM seguimientos WHERE usuario_id = ? AND reporte_id = ?',
    [usuarioId, reporteId]
  );
  return rows.length > 0;
}

async function add(usuarioId, reporteId) {
  await pool.query(
    'INSERT IGNORE INTO seguimientos (usuario_id, reporte_id) VALUES (?, ?)',
    [usuarioId, reporteId]
  );
}

async function remove(usuarioId, reporteId) {
  await pool.query(
    'DELETE FROM seguimientos WHERE usuario_id = ? AND reporte_id = ?',
    [usuarioId, reporteId]
  );
}

async function getSeguidores(reporteId) {
  const [rows] = await pool.query(
    'SELECT usuario_id FROM seguimientos WHERE reporte_id = ?',
    [reporteId]
  );
  return rows.map((r) => r.usuario_id);
}

async function getByUsuario(usuarioId) {
  const [rows] = await pool.query(
    'SELECT reporte_id FROM seguimientos WHERE usuario_id = ?',
    [usuarioId]
  );
  return rows.map((r) => r.reporte_id);
}

module.exports = { exists, add, remove, getSeguidores, getByUsuario };
