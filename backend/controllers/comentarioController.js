const { v4: uuidv4 } = require('uuid');
const Comentario = require('../models/Comentario');

async function create(req, res) {
  const { authorId, text } = req.body;
  const esOficial = req.user?.role === 'admin';
  try {
    const comentario = await Comentario.create(uuidv4(), req.params.id, authorId, text, esOficial);
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
