const bcrypt = require('bcryptjs');
const pool = require('../db');

async function findByCredentials(username, password) {
  const [rows] = await pool.query(
    'SELECT id, nombre_usuario AS username, nombre AS name, avatar, foto AS photo, rol AS role, contrasena FROM usuarios WHERE nombre_usuario = ?',
    [username]
  );
  const user = rows[0];
  if (!user) return null;
  const match = await bcrypt.compare(password, user.contrasena);
  if (!match) return null;
  const { contrasena, ...safeUser } = user;
  return safeUser;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, nombre_usuario AS username, nombre AS name, avatar, foto AS photo, rol AS role FROM usuarios WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function existsByUsername(username) {
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE nombre_usuario = ?', [username]);
  return rows.length > 0;
}

async function create(id, { username, password, name, avatar }) {
  const hashed = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO usuarios (id, nombre_usuario, contrasena, nombre, avatar, rol) VALUES (?, ?, ?, ?, ?, 'vecino')",
    [id, username, hashed, name, avatar]
  );
  return findById(id);
}

async function update(id, { name, photo }) {
  await pool.query(
    'UPDATE usuarios SET nombre = COALESCE(?, nombre), foto = COALESCE(?, foto) WHERE id = ?',
    [name ?? null, photo ?? null, id]
  );
  return findById(id);
}

module.exports = { findByCredentials, findById, existsByUsername, create, update };
