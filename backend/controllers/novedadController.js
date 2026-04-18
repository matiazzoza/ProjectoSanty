const { randomUUID } = require('crypto');
const Novedad = require('../models/Novedad');
const Notificacion = require('../models/Notificacion');
const pool = require('../db');

// Empleado: cargar novedad
async function cargarNovedad(req, res) {
  const { reporteId } = req.params;
  const { tipo, descripcion, foto } = req.body;

  if (!tipo || !descripcion) return res.status(400).json({ error: 'Tipo y descripción son obligatorios.' });

  try {
    const [rep] = await pool.query('SELECT titulo FROM reportes WHERE id = ?', [reporteId]);
    if (!rep[0]) return res.status(404).json({ error: 'Reporte no encontrado.' });

    const novedad = await Novedad.create(randomUUID(), {
      reporteId, empleadoId: req.user.id, tipo, descripcion, foto,
    });

    // Si es bloqueante, cambiar estado interno
    if (tipo === 'bloqueante') {
      await pool.query(
        "UPDATE reportes SET estado_interno = 'bloqueado', actualizado_en = NOW() WHERE id = ?",
        [reporteId]
      );
    }

    // Notificar a todos los admins
    const [admins] = await pool.query("SELECT id FROM usuarios WHERE rol = 'admin'");
    const emoji = tipo === 'bloqueante' ? '🚨' : '📝';
    const tipoLabel = tipo === 'bloqueante' ? 'BLOQUEANTE' : 'informativa';
    await Promise.all(admins.map((a) =>
      Notificacion.create(randomUUID(), a.id,
        `${emoji} Novedad ${tipoLabel} en el reporte "${rep[0].titulo}": ${descripcion.slice(0, 80)}${descripcion.length > 80 ? '...' : ''}`
      )
    ));

    res.status(201).json(novedad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin: responder novedad (y desbloquear si era bloqueante)
async function responderNovedad(req, res) {
  const { novedadId } = req.params;
  const { respuesta } = req.body;

  if (!respuesta) return res.status(400).json({ error: 'La respuesta es obligatoria.' });

  try {
    const [rows] = await pool.query('SELECT * FROM novedades WHERE id = ?', [novedadId]);
    const novedad = rows[0];
    if (!novedad) return res.status(404).json({ error: 'Novedad no encontrada.' });

    await Novedad.responder(novedadId, { respuesta, respondidoPor: req.user.id });

    // Si era bloqueante, devolver a en_ejecucion
    if (novedad.tipo === 'bloqueante') {
      await pool.query(
        "UPDATE reportes SET estado_interno = 'en_ejecucion', actualizado_en = NOW() WHERE id = ?",
        [novedad.reporte_id]
      );
    }

    // Notificar al empleado
    const [rep] = await pool.query('SELECT titulo FROM reportes WHERE id = ?', [novedad.reporte_id]);
    await Notificacion.create(randomUUID(), novedad.empleado_id,
      `✅ El admin respondió tu novedad en "${rep[0]?.titulo}": ${respuesta.slice(0, 80)}${respuesta.length > 80 ? '...' : ''}`
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Obtener novedades de un reporte
async function getNovedades(req, res) {
  try {
    const novedades = await Novedad.getByReporte(req.params.reporteId);
    res.json(novedades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { cargarNovedad, responderNovedad, getNovedades };
