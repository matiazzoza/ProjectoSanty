const pool = require('../db');

async function create(id, reporteId, autorId, texto, esOficial = false) {
  await pool.query(
    'INSERT INTO comentarios (id, reporte_id, autor_id, texto, es_oficial) VALUES (?, ?, ?, ?, ?)',
    [id, reporteId, autorId, texto, esOficial ? 1 : 0]
  );
  const [rows] = await pool.query(
    `SELECT c.id, c.reporte_id, c.texto AS text, c.creado_en AS createdAt,
            c.autor_id AS authorId, u.nombre AS authorName,
            c.es_oficial AS esOficial, u.rol AS authorRole
     FROM comentarios c JOIN usuarios u ON c.autor_id = u.id
     WHERE c.id = ?`,
    [id]
  );
  return rows[0];
}

async function remove(id, reporteId) {
  await pool.query('DELETE FROM comentarios WHERE id = ? AND reporte_id = ?', [id, reporteId]);
}

module.exports = { create, remove };
