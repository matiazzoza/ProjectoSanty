const { randomUUID } = require('crypto');
const MensajeAdmin = require('../models/MensajeAdmin');
const Notificacion = require('../models/Notificacion');
const { contienePalabraProhibida } = require('../utils/filtroTexto');
const { getAdminYSuperadminIds, validarAsignacionActiva } = require('../utils/dbHelpers');

async function enviarMensaje(req, res) {
  const { contenido, reporteId, contexto } = req.body;
  if (!contenido?.trim()) return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
  if (contienePalabraProhibida(contenido)) return res.status(400).json({ error: 'Tu mensaje contiene lenguaje inapropiado.' });
  if (reporteId && !contexto) return res.status(400).json({ error: 'Debés indicar el contexto del mensaje.' });

  try {
    if (reporteId) {
      const asignado = await validarAsignacionActiva(reporteId, req.user.id);
      if (!asignado) return res.status(403).json({ error: 'No estás asignado activamente a ese reporte.' });
    }

    const mensaje = await MensajeAdmin.create(
      randomUUID(), req.user.id, contenido.trim(),
      reporteId || null, contexto || null
    );

    const admins = await getAdminYSuperadminIds();
    const preview = contenido.trim().slice(0, 80) + (contenido.trim().length > 80 ? '...' : '');
    const contextoLabel = contexto === 'equipo' ? ' [Equipo]' : contexto === 'reporte' ? ' [Reporte]' : contexto === 'ambos' ? ' [Ambos]' : '';
    await Promise.all(admins.map((a) =>
      Notificacion.create(randomUUID(), a.id,
        `💬 Mensaje de ${req.user.name}${contextoLabel}: "${preview}"`,
        `/panel-admin`
      )
    ));

    res.status(201).json(mensaje);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMensajes(req, res) {
  try {
    res.json(await MensajeAdmin.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMisMensajes(req, res) {
  try {
    res.json(await MensajeAdmin.getMisMensajes(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function marcarLeido(req, res) {
  try {
    await MensajeAdmin.marcarLeido(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { enviarMensaje, getMensajes, getMisMensajes, marcarLeido };
