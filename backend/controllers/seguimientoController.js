const Seguimiento = require('../models/Seguimiento');

async function toggle(req, res) {
  const { usuarioId } = req.body;
  const reporteId = req.params.id;
  try {
    const siguiendo = await Seguimiento.exists(usuarioId, reporteId);
    if (siguiendo) {
      await Seguimiento.remove(usuarioId, reporteId);
      res.json({ siguiendo: false });
    } else {
      await Seguimiento.add(usuarioId, reporteId);
      res.json({ siguiendo: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getByUsuario(req, res) {
  try {
    const ids = await Seguimiento.getByUsuario(req.params.userId);
    res.json(ids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { toggle, getByUsuario };
