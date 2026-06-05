const bcrypt = require('bcryptjs');
const pool = require('../db');

async function findByCredentials(username, password) {
  const [rows] = await pool.query(
    'SELECT id, nombre_usuario AS username, nombre AS name, avatar, rol AS role, email, email_verificado AS emailVerificado, contrasena FROM usuarios WHERE nombre_usuario = ?',
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
    'SELECT id, nombre_usuario AS username, nombre AS name, avatar, rol AS role FROM usuarios WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function existsByUsername(username) {
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE nombre_usuario = ?', [username]);
  return rows.length > 0;
}

async function existsByEmail(email) {
  const [rows] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  return rows.length > 0;
}

async function create(id, { username, password, name, avatar, email, token }) {
  const hashed = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO usuarios (id, nombre_usuario, contrasena, nombre, avatar, rol, email, email_verificado, token_verificacion) VALUES (?, ?, ?, ?, ?, 'vecino', ?, 0, ?)",
    [id, username, hashed, name, avatar, email, token]
  );
  return findById(id);
}

async function verificarEmail(token) {
  const [rows] = await pool.query(
    'SELECT id FROM usuarios WHERE token_verificacion = ? AND email_verificado = 0',
    [token]
  );
  if (rows.length === 0) return false;
  await pool.query(
    'UPDATE usuarios SET email_verificado = 1, token_verificacion = NULL WHERE token_verificacion = ?',
    [token]
  );
  return true;
}

async function update(id, { name, avatar }) {
  await pool.query(
    'UPDATE usuarios SET nombre = COALESCE(?, nombre), avatar = COALESCE(?, avatar) WHERE id = ?',
    [name ?? null, avatar ?? null, id]
  );
  return findById(id);
}

async function getAll() {
  const [rows] = await pool.query(
    'SELECT id, nombre_usuario AS username, nombre AS name, avatar, rol AS role FROM usuarios ORDER BY FIELD(rol, "superadmin", "admin", "empleado", "vecino"), nombre ASC'
  );
  return rows;
}

async function createByAdmin(id, { username, password, name, avatar, role }) {
  const hashed = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO usuarios (id, nombre_usuario, contrasena, nombre, avatar, rol, email_verificado) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [id, username, hashed, name, avatar ?? '🦁', role]
  );
  return findById(id);
}

async function updateByAdmin(id, { name, role, avatar }) {
  await pool.query(
    'UPDATE usuarios SET nombre = COALESCE(?, nombre), rol = COALESCE(?, rol), avatar = COALESCE(?, avatar) WHERE id = ?',
    [name ?? null, role ?? null, avatar ?? null, id]
  );
  return findById(id);
}

async function deleteById(id) {
  await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
}

async function getEspecialidades(userId) {
  const [rows] = await pool.query(
    'SELECT especialidad FROM usuario_especialidades WHERE usuario_id = ? ORDER BY especialidad',
    [userId]
  );
  return rows.map((r) => r.especialidad);
}

async function setEspecialidades(userId, especialidades) {
  await pool.query('DELETE FROM usuario_especialidades WHERE usuario_id = ?', [userId]);
  if (especialidades.length > 0) {
    const values = especialidades.map((e) => [userId, e]);
    await pool.query('INSERT INTO usuario_especialidades (usuario_id, especialidad) VALUES ?', [values]);
  }
  return getEspecialidades(userId);
}

async function actualizarTokenVerificacion(email, token) {
  const [rows] = await pool.query(
    'SELECT id, nombre FROM usuarios WHERE email = ? AND email_verificado = 0',
    [email]
  );
  if (rows.length === 0) return null;
  await pool.query(
    'UPDATE usuarios SET token_verificacion = ? WHERE email = ? AND email_verificado = 0',
    [token, email]
  );
  return rows[0].nombre;
}

async function findByEmailWithPassword(email) {
  const [rows] = await pool.query(
    'SELECT id, nombre AS name, email, contrasena FROM usuarios WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

async function findByIdWithPassword(id) {
  const [rows] = await pool.query(
    'SELECT id, nombre AS name, email, contrasena, rol FROM usuarios WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function updatePassword(id, newPassword) {
  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [hashed, id]);
}

module.exports = { findByCredentials, findById, existsByUsername, existsByEmail, create, verificarEmail, update, getAll, createByAdmin, updateByAdmin, deleteById, findByEmailWithPassword, findByIdWithPassword, updatePassword, actualizarTokenVerificacion, getEspecialidades, setEspecialidades };
