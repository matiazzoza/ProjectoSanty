const { randomUUID } = require('crypto');
const Novedad = require('../models/Novedad');
const Notificacion = require('../models/Notificacion');
const pool = require('../db');
const { contienePalabraProhibida } = require('../utils/filtroTexto');
const { getReporteTitulo, getAdminIds, validarAsignacionActiva } = require('../utils/dbHelpers');

async function cargarNovedad(req, res) {
  const { reporteId } = req.params;
  const { tipo, descripcion, foto } = req.body;

  if (!tipo || !descripcion) return res.status(400).json({ error: 'Tipo y descripción son obligatorios.' });
  if (contienePalabraProhibida(descripcion)) return res.status(400).json({ error: 'Tu novedad contiene lenguaje inapropiado.' });

  try {
    const titulo = await getReporteTitulo(reporteId);
    if (!titulo) return res.status(404).json({ error: 'Reporte no encontrado.' });

    const asignado = await validarAsignacionActiva(reporteId, req.user.id);
    if (!asignado) return res.status(403).json({ error: 'No estás asignado activamente a este reporte.' });

    const novedad = await Novedad.create(randomUUID(), {
      reporteId, empleadoId: req.user.id, tipo, descripcion, foto,
    });

    if (tipo === 'bloqueante') {
      await pool.query(
        "UPDATE reportes SET estado_interno = 'bloqueado', actualizado_en = NOW() WHERE id = ?",
        [reporteId]
      );
    }

    const admins = await getAdminIds();
    const emoji = tipo === 'bloqueante' ? '🚨' : '📝';
    const tipoLabel = tipo === 'bloqueante' ? 'BLOQUEANTE' : 'informativa';
    await Promise.all(admins.map((a) =>
      Notificacion.create(randomUUID(), a.id,
        `${emoji} Novedad ${tipoLabel} en el reporte "${titulo}": ${descripcion.slice(0, 80)}${descripcion.length > 80 ? '...' : ''}`,
        `/reporte/${reporteId}`
      )
    ));

    res.status(201).json(novedad);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function responderNovedad(req, res) {
  const { novedadId } = req.params;
  const { respuesta } = req.body;

  if (!respuesta) return res.status(400).json({ error: 'La respuesta es obligatoria.' });

  try {
    const [rows] = await pool.query('SELECT * FROM novedades WHERE id = ?', [novedadId]);
    const novedad = rows[0];
    if (!novedad) return res.status(404).json({ error: 'Novedad no encontrada.' });

    await Novedad.responder(novedadId, { respuesta, respondidoPor: req.user.id });

    if (novedad.tipo === 'bloqueante') {
      await pool.query(
        "UPDATE reportes SET estado_interno = 'en_ejecucion', actualizado_en = NOW() WHERE id = ?",
        [novedad.reporte_id]
      );
    }

    const titulo = await getReporteTitulo(novedad.reporte_id);
    await Notificacion.create(randomUUID(), novedad.empleado_id,
      `✅ El admin respondió tu novedad en "${titulo}": ${respuesta.slice(0, 80)}${respuesta.length > 80 ? '...' : ''}`,
      `/reporte/${novedad.reporte_id}/novedad/${novedad.id}`
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getNovedades(req, res) {
  try {
    const novedades = await Novedad.getByReporte(req.params.reporteId);
    res.json(novedades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getAllNovedades(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT n.id, n.tipo, n.descripcion, n.foto, n.creado_en AS creadoEn,
              n.respuesta_admin AS respuestaAdmin, n.respondido_en AS respondidoEn,
              n.reporte_id AS reporteId, r.titulo AS reporteTitulo,
              n.empleado_id AS empleadoId, u.nombre AS empleadoNombre
       FROM novedades n
       JOIN reportes r ON n.reporte_id = r.id
       JOIN usuarios u ON n.empleado_id = u.id
       WHERE r.estado != 'resuelto'
       ORDER BY n.respuesta_admin IS NOT NULL ASC, n.creado_en DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { cargarNovedad, responderNovedad, getNovedades, getAllNovedades };
