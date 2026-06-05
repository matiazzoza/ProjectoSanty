const { randomUUID } = require('crypto');
const Avance = require('../models/Avance');
const Notificacion = require('../models/Notificacion');
const pool = require('../db');
const { contienePalabraProhibida } = require('../utils/filtroTexto');
const { getReporteTitulo, getAdminIds, validarAsignacionActiva } = require('../utils/dbHelpers');

async function registrarAvance(req, res) {
  const { reporteId } = req.params;
  const { descripcion, porcentaje, lat, lng } = req.body;

  if (!descripcion?.trim()) return res.status(400).json({ error: 'La descripción es obligatoria.' });
  if (contienePalabraProhibida(descripcion)) return res.status(400).json({ error: 'Tu avance contiene lenguaje inapropiado.' });

  try {
    const titulo = await getReporteTitulo(reporteId);
    if (!titulo) return res.status(404).json({ error: 'Reporte no encontrado.' });

    const asignado = await validarAsignacionActiva(reporteId, req.user.id);
    if (!asignado) return res.status(403).json({ error: 'No estás asignado activamente a este reporte.' });

    const avance = await Avance.create(randomUUID(), {
      reporteId, empleadoId: req.user.id,
      descripcion: descripcion.trim(),
      porcentaje: porcentaje ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
    });

    await pool.query('UPDATE reportes SET actualizado_en = NOW() WHERE id = ?', [reporteId]);

    const admins = await getAdminIds();
    await Promise.all(admins.map((a) =>
      Notificacion.create(randomUUID(), a.id,
        `📊 Nuevo avance en "${titulo}"${porcentaje ? ` (${porcentaje}%)` : ''}: ${descripcion.trim().slice(0, 80)}`,
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
