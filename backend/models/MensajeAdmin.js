const pool = require('../db');

async function create(id, empleadoId, contenido, reporteId = null, contexto = null) {
  await pool.query(
    'INSERT INTO mensajes_admin (id, empleado_id, contenido, reporte_id, contexto) VALUES (?, ?, ?, ?, ?)',
    [id, empleadoId, contenido, reporteId, contexto]
  );
  const [rows] = await pool.query(
    `SELECT m.id, m.contenido, m.leido, m.creado_en AS creadoEn,
            m.reporte_id AS reporteId, m.contexto,
            m.empleado_id AS empleadoId, u.nombre AS empleadoNombre, u.avatar AS empleadoAvatar,
            r.titulo AS reporteTitulo
     FROM mensajes_admin m
     JOIN usuarios u ON u.id = m.empleado_id
     LEFT JOIN reportes r ON r.id = m.reporte_id
     WHERE m.id = ?`,
    [id]
  );
  return rows[0];
}

async function getAll() {
  const [rows] = await pool.query(
    `SELECT m.id, m.contenido, m.leido, m.creado_en AS creadoEn,
            m.reporte_id AS reporteId, m.contexto,
            m.empleado_id AS empleadoId, u.nombre AS empleadoNombre, u.avatar AS empleadoAvatar,
            r.titulo AS reporteTitulo
     FROM mensajes_admin m
     JOIN usuarios u ON u.id = m.empleado_id
     LEFT JOIN reportes r ON r.id = m.reporte_id
     ORDER BY m.leido ASC, m.creado_en DESC`
  );
  return rows;
}

async function getMisMensajes(empleadoId) {
  const [rows] = await pool.query(
    `SELECT m.id, m.contenido, m.leido, m.creado_en AS creadoEn,
            m.reporte_id AS reporteId, m.contexto,
            r.titulo AS reporteTitulo
     FROM mensajes_admin m
     LEFT JOIN reportes r ON r.id = m.reporte_id
     WHERE m.empleado_id = ?
     ORDER BY m.creado_en DESC`,
    [empleadoId]
  );
  return rows;
}

async function marcarLeido(id) {
  await pool.query('UPDATE mensajes_admin SET leido = 1 WHERE id = ?', [id]);
}

module.exports = { create, getAll, getMisMensajes, marcarLeido };
