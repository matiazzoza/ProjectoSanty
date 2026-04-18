const pool = require('../db');

async function getByReporte(reporteId) {
  const [rows] = await pool.query(
    `SELECT n.*,
            u.nombre AS empleado_nombre,
            r.nombre AS respondido_por_nombre
     FROM novedades n
     JOIN usuarios u ON n.empleado_id = u.id
     LEFT JOIN usuarios r ON n.respondido_por = r.id
     WHERE n.reporte_id = ?
     ORDER BY n.creado_en ASC`,
    [reporteId]
  );
  return rows;
}

async function create(id, { reporteId, empleadoId, tipo, descripcion, foto }) {
  await pool.query(
    'INSERT INTO novedades (id, reporte_id, empleado_id, tipo, descripcion, foto) VALUES (?, ?, ?, ?, ?, ?)',
    [id, reporteId, empleadoId, tipo, descripcion, foto ?? null]
  );
  const [rows] = await pool.query('SELECT * FROM novedades WHERE id = ?', [id]);
  return rows[0];
}

async function responder(id, { respuesta, respondidoPor }) {
  await pool.query(
    'UPDATE novedades SET respuesta_admin = ?, respondido_por = ?, respondido_en = NOW() WHERE id = ?',
    [respuesta, respondidoPor, id]
  );
}

module.exports = { getByReporte, create, responder };
