const Notificacion = require('../models/Notificacion');

async function getAll(req, res) {
  if (req.params.userId !== req.user.id)
    return res.status(403).json({ error: 'No podés ver las notificaciones de otro usuario.' });
  try {
    const notifs = await Notificacion.getByUsuario(req.params.userId);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function marcarLeida(req, res) {
  try {
    await Notificacion.marcarLeida(req.params.id, req.user.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function crearAlerta(req, res) {
  try {
    const { mensaje } = req.body;
    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }
    await Notificacion.createForAllUsers(mensaje.trim());
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, marcarLeida, crearAlerta };
