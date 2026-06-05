const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { SECRET } = require('../middleware/auth');
const { enviarVerificacion, enviarRecuperacion } = require('../services/emailService');

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '7d' });
}

async function login(req, res) {
  const { username, password } = req.body;
  try {
    const user = await Usuario.findByCredentials(username, password);
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    if (user.emailVerificado === 0) {
      return res.status(403).json({ error: 'Debés verificar tu correo electrónico antes de iniciar sesión.' });
    }
    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function register(req, res) {
  const { username, password, name, email, avatar } = req.body;
  if (!username || !password || !name || !email)
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  try {
    const existeUsername = await Usuario.existsByUsername(username);
    if (existeUsername) return res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });
    const existeEmail = await Usuario.existsByEmail(email);
    if (existeEmail) return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
    const id = randomUUID();
    const token = randomUUID();
    const avatarFinal = avatar || name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    await Usuario.create(id, { username, password, name, avatar: avatarFinal, email, token });
    enviarVerificacion(email, name, token)
      .then(() => console.log('✅ Email enviado a:', email))
      .catch((emailErr) => console.error('❌ Error al enviar email:', emailErr.message));
    res.status(201).json({ pendingVerification: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function verificarEmail(req, res) {
  const { token } = req.params;
  try {
    const ok = await Usuario.verificarEmail(token);
    if (!ok) return res.status(400).json({ error: 'Token inválido o ya verificado.' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProfile(req, res) {
  const { name, avatar } = req.body;
  try {
    const user = await Usuario.update(req.params.id, { name, avatar });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function reenviarVerificacion(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es obligatorio.' });
  try {
    const token = randomUUID();
    const nombre = await Usuario.actualizarTokenVerificacion(email, token);
    if (nombre) {
      enviarVerificacion(email, nombre, token)
        .catch((err) => console.error('❌ Error email verificación:', err.message));
    }
    // Siempre responde OK para no revelar si el email existe
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function solicitarRecuperacion(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es obligatorio.' });
  try {
    const user = await Usuario.findByEmailWithPassword(email);
    if (user) {
      const resetSecret = SECRET + user.contrasena;
      const token = jwt.sign({ id: user.id }, resetSecret, { expiresIn: '1h' });
      enviarRecuperacion(email, user.name, token)
        .catch((err) => console.error('❌ Error email recuperación:', err.message));
    }
    // Siempre responde OK para no revelar si el email existe
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function confirmarRecuperacion(req, res) {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  try {
    const decoded = jwt.decode(token);
    if (!decoded?.id) return res.status(400).json({ error: 'Token inválido.' });

    const user = await Usuario.findByIdWithPassword(decoded.id);
    if (!user) return res.status(400).json({ error: 'Token inválido.' });

    try {
      jwt.verify(token, SECRET + user.contrasena);
    } catch {
      return res.status(400).json({ error: 'El link expiró o ya fue usado.' });
    }

    await Usuario.updatePassword(decoded.id, password);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function cambiarContrasena(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6)
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  try {
    const user = await Usuario.findByIdWithPassword(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const match = await bcrypt.compare(currentPassword, user.contrasena);
    if (!match) return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
    await Usuario.updatePassword(req.user.id, newPassword);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function triggerPasswordReset(req, res) {
  const { userId } = req.params;
  if (req.user.id === userId)
    return res.status(400).json({ error: 'Usá el formulario de cambio de contraseña para tu propia cuenta.' });
  try {
    const target = await Usuario.findByIdWithPassword(userId);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (req.user.role === 'admin' && target.rol !== 'empleado' && target.rol !== 'vecino')
      return res.status(403).json({ error: 'No tenés permiso para resetear la contraseña de este usuario.' });

    if (!target.email)
      return res.status(400).json({ error: 'Este usuario no tiene email registrado. Editá su contraseña directamente.' });

    const resetSecret = SECRET + target.contrasena;
    const token = jwt.sign({ id: target.id }, resetSecret, { expiresIn: '1h' });
    enviarRecuperacion(target.email, target.name, token)
      .catch((err) => console.error('❌ Error email reset:', err.message));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { login, register, verificarEmail, updateProfile, reenviarVerificacion, solicitarRecuperacion, confirmarRecuperacion, cambiarContrasena, triggerPasswordReset };
