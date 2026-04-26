const pool = require('../db');
const { randomUUID } = require('crypto');

async function getByUsuario(usuarioId) {
  const [rows] = await pool.query(
    `SELECT id, mensaje, link, leida, creado_en AS creadoEn
     FROM notificaciones WHERE usuario_id = ? ORDER BY creado_en DESC LIMIT 20`,
    [usuarioId]
  );
  return rows;
}

async function create(id, usuarioId, mensaje, link = null) {
  await pool.query(
    'INSERT INTO notificaciones (id, usuario_id, mensaje, link) VALUES (?, ?, ?, ?)',
    [id, usuarioId, mensaje, link]
  );
}

async function createForAllUsers(mensaje) {
  const [users] = await pool.query('SELECT id FROM usuarios');
  await Promise.all(
    users.map((u) =>
      pool.query(
        'INSERT INTO notificaciones (id, usuario_id, mensaje) VALUES (?, ?, ?)',
        [randomUUID(), u.id, mensaje]
      )
    )
  );
}

async function marcarLeida(id) {
  await pool.query('UPDATE notificaciones SET leida = 1 WHERE id = ?', [id]);
}

module.exports = { getByUsuario, create, createForAllUsers, marcarLeida };
