const { randomUUID } = require('crypto');
const Usuario = require('../models/Usuario');

async function getAll(req, res) {
  try {
    const usuarios = await Usuario.getAll();
    res.json(usuarios);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
}

async function create(req, res) {
  const { username, password, name, avatar, role } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  const rolesPermitidos = ['admin', 'empleado', 'superadmin'];
  if (!rolesPermitidos.includes(role)) {
    return res.status(400).json({ error: 'Rol no válido.' });
  }
  const existe = await Usuario.existsByUsername(username);
  if (existe) return res.status(409).json({ error: 'El nombre de usuario ya existe.' });
  try {
    const usuario = await Usuario.createByAdmin(randomUUID(), { username, password, name, avatar, role });
    res.status(201).json(usuario);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear usuario.' });
  }
}

async function update(req, res) {
  const { id } = req.params;
  const { name, role, avatar } = req.body;
  const rolesPermitidos = ['admin', 'empleado', 'superadmin', 'vecino'];
  if (role && !rolesPermitidos.includes(role)) {
    return res.status(400).json({ error: 'Rol no válido.' });
  }
  try {
    const usuario = await Usuario.updateByAdmin(id, { name, role, avatar });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(usuario);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar usuario.' });
  }
}

async function remove(req, res) {
  const { id } = req.params;
  if (id === req.user.id) {
    return res.status(400).json({ error: 'No podés eliminarte a vos mismo.' });
  }
  try {
    await Usuario.deleteById(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar usuario.' });
  }
}

async function getEspecialidades(req, res) {
  try {
    const especialidades = await Usuario.getEspecialidades(req.params.id);
    res.json(especialidades);
  } catch {
    res.status(500).json({ error: 'Error al obtener especialidades.' });
  }
}

async function setEspecialidades(req, res) {
  const VALIDAS = ['fontanero', 'electricista', 'jardinero', 'pavimentacion', 'limpieza', 'general'];
  const { especialidades } = req.body;
  if (!Array.isArray(especialidades) || especialidades.some((e) => !VALIDAS.includes(e))) {
    return res.status(400).json({ error: 'Especialidades inválidas.' });
  }
  try {
    const result = await Usuario.setEspecialidades(req.params.id, especialidades);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error al actualizar especialidades.' });
  }
}

module.exports = { getAll, create, update, remove, getEspecialidades, setEspecialidades };
