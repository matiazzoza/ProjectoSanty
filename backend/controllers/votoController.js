const Voto = require('../models/Voto');

async function toggle(req, res) {
  const { userId } = req.body;
  const reporteId = req.params.id;
  try {
    const yaVoto = await Voto.exists(reporteId, userId);
    if (yaVoto) {
      await Voto.remove(reporteId, userId);
    } else {
      await Voto.add(reporteId, userId);
    }
    const votos = await Voto.getByReporte(reporteId);
    res.json(votos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { toggle };
