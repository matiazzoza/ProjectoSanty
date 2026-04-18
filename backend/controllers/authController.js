const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
}

async function login(req, res) {
  const { username, password } = req.body;
  try {
    const user = await Usuario.findByCredentials(username, password);
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function register(req, res) {
  const { username, password, name } = req.body;
  if (!username || !password || !name)
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  try {
    const existe = await Usuario.existsByUsername(username);
    if (existe) return res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });
    const id = uuidv4();
    const avatar = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    const user = await Usuario.create(id, { username, password, name, avatar });
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProfile(req, res) {
  const { name, photo } = req.body;
  try {
    const user = await Usuario.update(req.params.id, { name, photo });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { login, register, updateProfile };
