const Barrio = require('../models/Barrio');

async function getAll(req, res) {
  try {
    res.json(await Barrio.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll };
