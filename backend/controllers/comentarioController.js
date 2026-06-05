const { randomUUID } = require('crypto');
const Comentario = require('../models/Comentario');
const { contienePalabraProhibida } = require('../utils/filtroTexto');

async function create(req, res) {
  const { authorId, text } = req.body;
  const esOficial = req.user?.role === 'admin';
  if (contienePalabraProhibida(text))
    return res.status(400).json({ error: 'Tu comentario contiene lenguaje inapropiado.' });
  try {
    const comentario = await Comentario.create(randomUUID(), req.params.id, authorId, text, esOficial);
    res.status(201).json(comentario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await Comentario.remove(req.params.commentId, req.params.reportId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { create, remove };
