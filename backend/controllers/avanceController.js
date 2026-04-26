const { randomUUID } = require('crypto');
const Avance = require('../models/Avance');
const Notificacion = require('../models/Notificacion');
const pool = require('../db');

async function registrarAvance(req, res) {
  const { reporteId } = req.params;
  const { descripcion, porcentaje } = req.body;

  if (!descripcion?.trim()) return res.status(400).json({ error: 'La descripción es obligatoria.' });

  try {
    const [rep] = await pool.query('SELECT titulo FROM reportes WHERE id = ?', [reporteId]);
    if (!rep[0]) return res.status(404).json({ error: 'Reporte no encontrado.' });

    const avance = await Avance.create(randomUUID(), {
      reporteId, empleadoId: req.user.id,
      descripcion: descripcion.trim(),
      porcentaje: porcentaje ?? null,
    });

    // Notificar al admin
    const [admins] = await pool.query("SELECT id FROM usuarios WHERE rol = 'admin'");
    await Promise.all(admins.map((a) =>
      Notificacion.create(randomUUID(), a.id,
        `📊 Nuevo avance en "${rep[0].titulo}"${porcentaje ? ` (${porcentaje}%)` : ''}: ${descripcion.trim().slice(0, 80)}`,
        `/reporte/${reporteId}`
      )
    ));

    res.status(201).json(avance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAvances(req, res) {
  try {
    const avances = await Avance.getByReporte(req.params.reporteId);
    res.json(avances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { registrarAvance, getAvances };
