const { randomUUID } = require('crypto');
const pool = require('../db');
const Asignacion = require('../models/Asignacion');
const Notificacion = require('../models/Notificacion');
const HistorialEstado = require('../models/HistorialEstado');

// Admin: obtener todos los empleados
async function getEmpleados(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre AS name, avatar, nombre_usuario AS username FROM usuarios WHERE rol = 'empleado'"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin: asignar empleado a reporte
async function asignar(req, res) {
  const { reporteId, empleadoId } = req.body;
  try {
    // Quitar asignaciones previas
    await Asignacion.removeByReporte(reporteId);

    // Crear nueva asignación
    await Asignacion.create(randomUUID(), reporteId, empleadoId, true);

    // Cambiar estado interno a 'asignado', estado público a 'en_proceso'
    const actual = await pool.query('SELECT estado, titulo FROM reportes WHERE id = ?', [reporteId]);
    const reporte = actual[0][0];

    await pool.query(
      "UPDATE reportes SET estado = 'en_proceso', estado_interno = 'asignado', actualizado_en = NOW() WHERE id = ?",
      [reporteId]
    );

    // Historial
    await HistorialEstado.create(randomUUID(), reporteId, reporte.estado, 'en_proceso', req.user.id);

    // Notificar al empleado
    await Notificacion.create(randomUUID(), empleadoId,
      `📋 Se te asignó el reporte "${reporte.titulo}". Revisalo en tu panel.`
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Empleado: ver sus asignaciones
async function getMisAsignaciones(req, res) {
  try {
    const asignaciones = await Asignacion.getByEmpleado(req.user.id);
    res.json(asignaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Empleado: marcar en ejecución (con foto de campo obligatoria si no hay foto inicial)
async function marcarEnEjecucion(req, res) {
  const { reporteId } = req.params;
  const { fotoCampo } = req.body;
  try {
    const [rows] = await pool.query('SELECT foto, estado_interno, titulo FROM reportes WHERE id = ?', [reporteId]);
    const reporte = rows[0];
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado.' });

    // Si no tiene foto inicial, la foto de campo es obligatoria
    if (!reporte.foto && !fotoCampo) {
      return res.status(400).json({ error: 'Este reporte no tiene foto inicial. Debés subir una foto del estado actual del campo.' });
    }

    await pool.query(
      "UPDATE reportes SET estado_interno = 'en_ejecucion', foto_campo = COALESCE(?, foto_campo), actualizado_en = NOW() WHERE id = ?",
      [fotoCampo ?? null, reporteId]
    );

    // Notificar al admin
    const [admins] = await pool.query("SELECT id FROM usuarios WHERE rol = 'admin'");
    await Promise.all(admins.map((a) =>
      Notificacion.create(randomUUID(), a.id,
        `🔧 El empleado inició la ejecución del reporte "${reporte.titulo}".`
      )
    ));

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Empleado: proponer cierre con foto de resolución
async function proponerCierre(req, res) {
  const { reporteId } = req.params;
  const { fotoResolucion } = req.body;
  try {
    if (!fotoResolucion) return res.status(400).json({ error: 'La foto de resolución es obligatoria para proponer el cierre.' });

    const [rows] = await pool.query('SELECT titulo FROM reportes WHERE id = ?', [reporteId]);
    const reporte = rows[0];
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado.' });

    await pool.query(
      "UPDATE reportes SET estado_interno = 'pendiente_validacion', foto_resolucion = ?, actualizado_en = NOW() WHERE id = ?",
      [fotoResolucion, reporteId]
    );

    // Notificar al admin
    const [admins] = await pool.query("SELECT id FROM usuarios WHERE rol = 'admin'");
    await Promise.all(admins.map((a) =>
      Notificacion.create(randomUUID(), a.id,
        `✅ El empleado propone cerrar el reporte "${reporte.titulo}". Revisá la foto y validá el cierre.`
      )
    ));

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin: validar cierre
async function validarCierre(req, res) {
  const { reporteId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT titulo, autor_id, estado FROM reportes WHERE id = ?', [reporteId]
    );
    const reporte = rows[0];
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado.' });

    await pool.query(
      "UPDATE reportes SET estado = 'resuelto', estado_interno = 'resuelto', actualizado_en = NOW() WHERE id = ?",
      [reporteId]
    );

    await HistorialEstado.create(randomUUID(), reporteId, reporte.estado, 'resuelto', req.user.id);

    // Notificar al autor (vecino)
    await Notificacion.create(randomUUID(), reporte.autor_id,
      `✅ Tu reporte "${reporte.titulo}" fue resuelto por el municipio.`
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin: rechazar cierre propuesto y devolver a en_ejecucion
async function rechazarCierre(req, res) {
  const { reporteId } = req.params;
  const { motivo } = req.body;
  try {
    const [rows] = await pool.query('SELECT titulo FROM reportes WHERE id = ?', [reporteId]);
    const reporte = rows[0];

    await pool.query(
      "UPDATE reportes SET estado_interno = 'en_ejecucion', foto_resolucion = NULL, actualizado_en = NOW() WHERE id = ?",
      [reporteId]
    );

    // Notificar al empleado asignado
    const [asignados] = await pool.query('SELECT empleado_id FROM asignaciones WHERE reporte_id = ?', [reporteId]);
    await Promise.all(asignados.map((a) =>
      Notificacion.create(randomUUID(), a.empleado_id,
        `❌ El admin rechazó el cierre del reporte "${reporte.titulo}".${motivo ? ` Motivo: ${motivo}` : ''} Debés completar la obra y volver a proponer cierre.`
      )
    ));

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Obtener asignaciones de un reporte (para mostrar en detalle)
async function getAsignacionesReporte(req, res) {
  try {
    const asignaciones = await Asignacion.getByReporte(req.params.reporteId);
    res.json(asignaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getEmpleados, asignar, getMisAsignaciones, marcarEnEjecucion, proponerCierre, validarCierre, rechazarCierre, getAsignacionesReporte };
