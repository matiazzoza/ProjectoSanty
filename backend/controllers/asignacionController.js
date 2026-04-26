const { randomUUID } = require('crypto');
const pool = require('../db');
const Asignacion = require('../models/Asignacion');
const Notificacion = require('../models/Notificacion');
const HistorialEstado = require('../models/HistorialEstado');

// Admin: obtener todos los empleados
async function getEmpleados(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre AS name, avatar, nombre_usuario AS username, activo FROM usuarios WHERE rol = 'empleado' ORDER BY nombre ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin: crear empleado
async function crearEmpleado(req, res) {
  const { username, password, name } = req.body;
  if (!username || !password || !name)
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  try {
    const [existe] = await pool.query('SELECT id FROM usuarios WHERE nombre_usuario = ?', [username]);
    if (existe.length > 0) return res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });

    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);
    const id = require('crypto').randomUUID();
    const avatar = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

    await pool.query(
      "INSERT INTO usuarios (id, nombre_usuario, contrasena, nombre, avatar, rol) VALUES (?, ?, ?, ?, ?, 'empleado')",
      [id, username, hashed, name, avatar]
    );

    const [rows] = await pool.query(
      'SELECT id, nombre AS name, avatar, nombre_usuario AS username, activo FROM usuarios WHERE id = ?', [id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin: editar datos del empleado
async function editarEmpleado(req, res) {
  const { id } = req.params;
  const { name, username, password } = req.body;
  if (!name || !username) return res.status(400).json({ error: 'Nombre y usuario son obligatorios.' });
  try {
    // Verificar que el username no lo use otro empleado
    const [existe] = await pool.query('SELECT id FROM usuarios WHERE nombre_usuario = ? AND id != ?', [username, id]);
    if (existe.length > 0) return res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });

    if (password) {
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash(password, 10);
      const avatar = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      await pool.query(
        'UPDATE usuarios SET nombre = ?, nombre_usuario = ?, contrasena = ?, avatar = ? WHERE id = ?',
        [name, username, hashed, avatar, id]
      );
    } else {
      const avatar = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      await pool.query(
        'UPDATE usuarios SET nombre = ?, nombre_usuario = ?, avatar = ? WHERE id = ?',
        [name, username, avatar, id]
      );
    }

    const [rows] = await pool.query(
      'SELECT id, nombre AS name, avatar, nombre_usuario AS username, activo FROM usuarios WHERE id = ?', [id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin: perfil detallado de un empleado
async function getPerfilEmpleado(req, res) {
  const { id } = req.params;
  try {
    const [empRows] = await pool.query(
      'SELECT id, nombre AS name, avatar, nombre_usuario AS username, activo FROM usuarios WHERE id = ? AND rol = "empleado"',
      [id]
    );
    if (!empRows[0]) return res.status(404).json({ error: 'Empleado no encontrado.' });
    const emp = empRows[0];

    // Reportes asignados con su último avance
    const [reportes] = await pool.query(
      `SELECT r.id, r.titulo AS title, r.categoria AS category, r.estado AS status,
              r.estado_interno AS estadoInterno, r.barrio_id AS barrioId,
              b.nombre AS barrioNombre, a.asignado_en AS asignadoEn,
              (SELECT av.porcentaje FROM avances av WHERE av.reporte_id = r.id ORDER BY av.creado_en DESC LIMIT 1) AS ultimoPorcentaje,
              (SELECT av.descripcion FROM avances av WHERE av.reporte_id = r.id ORDER BY av.creado_en DESC LIMIT 1) AS ultimoAvance,
              (SELECT COUNT(*) FROM avances av WHERE av.reporte_id = r.id) AS totalAvances
       FROM asignaciones a
       JOIN reportes r ON a.reporte_id = r.id
       LEFT JOIN barrios b ON r.barrio_id = b.id
       WHERE a.empleado_id = ?
       ORDER BY a.asignado_en DESC`,
      [id]
    );

    // Novedades enviadas
    const [novedades] = await pool.query(
      `SELECT n.id, n.tipo, n.descripcion, n.foto, n.creado_en AS creadoEn,
              r.titulo AS reporteTitulo, r.id AS reporteId
       FROM novedades n
       JOIN reportes r ON n.reporte_id = r.id
       WHERE n.empleado_id = ?
       ORDER BY n.creado_en DESC
       LIMIT 20`,
      [id]
    );

    // Stats resumen
    const resueltos = reportes.filter((r) => r.status === 'resuelto').length;
    const enCurso   = reportes.filter((r) => r.status !== 'resuelto').length;

    res.json({ emp, reportes, novedades, stats: { resueltos, enCurso, totalNovedades: novedades.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin: activar/desactivar empleado
async function toggleEmpleado(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT activo FROM usuarios WHERE id = ?', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Empleado no encontrado.' });
    const nuevoEstado = rows[0].activo ? 0 : 1;
    await pool.query('UPDATE usuarios SET activo = ? WHERE id = ?', [nuevoEstado, id]);
    res.json({ activo: nuevoEstado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Admin: asignar empleado a reporte
async function asignar(req, res) {
  const { reporteId, empleadoId, prioridad = 'media', fechaLimite = null } = req.body;
  try {
    // Quitar asignaciones previas
    await Asignacion.removeByReporte(reporteId);

    // Crear nueva asignación
    await Asignacion.create(randomUUID(), reporteId, empleadoId, true, prioridad, fechaLimite);

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
      `📋 Se te asignó el reporte "${reporte.titulo}". Revisalo en tu panel.`,
      `/panel-empleado`
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Empleado: ver su propio perfil con stats e historial de resueltos
async function getMiPerfilEmpleado(req, res) {
  const id = req.user.id;
  try {
    const [empRows] = await pool.query(
      'SELECT id, nombre AS name, avatar, nombre_usuario AS username FROM usuarios WHERE id = ?', [id]
    );
    const emp = empRows[0];

    // Reportes resueltos (historial)
    const [resueltos] = await pool.query(
      `SELECT r.id, r.titulo AS title, r.categoria AS category, r.barrio_id AS barrioId,
              b.nombre AS barrioNombre, a.asignado_en AS asignadoEn, r.actualizado_en AS resueltaEn,
              DATEDIFF(r.actualizado_en, a.asignado_en) AS diasResolucion
       FROM asignaciones a
       JOIN reportes r ON a.reporte_id = r.id
       LEFT JOIN barrios b ON r.barrio_id = b.id
       WHERE a.empleado_id = ? AND r.estado = 'resuelto'
       ORDER BY r.actualizado_en DESC`,
      [id]
    );

    // Avances de reportes resueltos, agrupados por reporte
    const reporteIds = resueltos.map((r) => r.id);
    let avancesPorReporte = {};
    let novedadesPorReporte = {};

    if (reporteIds.length > 0) {
      const placeholders = reporteIds.map(() => '?').join(',');

      const [avances] = await pool.query(
        `SELECT av.reporte_id, av.descripcion, av.porcentaje, av.creado_en AS creadoEn
         FROM avances av
         WHERE av.reporte_id IN (${placeholders}) AND av.empleado_id = ?
         ORDER BY av.creado_en ASC`,
        [...reporteIds, id]
      );
      avances.forEach((av) => {
        if (!avancesPorReporte[av.reporte_id]) avancesPorReporte[av.reporte_id] = [];
        avancesPorReporte[av.reporte_id].push(av);
      });

      const [novedades] = await pool.query(
        `SELECT n.reporte_id, n.tipo, n.descripcion, n.creado_en AS creadoEn,
                n.respuesta_admin AS respuestaAdmin
         FROM novedades n
         WHERE n.reporte_id IN (${placeholders}) AND n.empleado_id = ?
         ORDER BY n.creado_en ASC`,
        [...reporteIds, id]
      );
      novedades.forEach((n) => {
        if (!novedadesPorReporte[n.reporte_id]) novedadesPorReporte[n.reporte_id] = [];
        novedadesPorReporte[n.reporte_id].push(n);
      });
    }

    // Adjuntar avances y novedades a cada reporte resuelto
    const resueltosConDetalle = resueltos.map((r) => ({
      ...r,
      avances: avancesPorReporte[r.id] || [],
      novedades: novedadesPorReporte[r.id] || [],
    }));

    // Stats
    const [[{ totalAsignados }]] = await pool.query(
      `SELECT COUNT(*) AS totalAsignados FROM asignaciones WHERE empleado_id = ?`, [id]
    );
    const [[{ totalNovedades }]] = await pool.query(
      `SELECT COUNT(*) AS totalNovedades FROM novedades WHERE empleado_id = ?`, [id]
    );
    const [[{ totalAvances }]] = await pool.query(
      `SELECT COUNT(*) AS totalAvances FROM avances WHERE empleado_id = ?`, [id]
    );
    const [[{ promedioResolucion }]] = await pool.query(
      `SELECT ROUND(AVG(DATEDIFF(r.actualizado_en, a.asignado_en)), 1) AS promedioResolucion
       FROM asignaciones a
       JOIN reportes r ON a.reporte_id = r.id
       WHERE a.empleado_id = ? AND r.estado = 'resuelto'`, [id]
    );

    res.json({
      emp,
      resueltos: resueltosConDetalle,
      stats: {
        totalAsignados: Number(totalAsignados),
        totalResueltos: resueltos.length,
        totalNovedades: Number(totalNovedades),
        totalAvances: Number(totalAvances),
        promedioResolucion: promedioResolucion !== null ? Number(promedioResolucion) : null,
        tasaResolucion: totalAsignados > 0 ? Math.round((resueltos.length / totalAsignados) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Empleado: ver sus novedades con respuestas del admin
async function getMisNovedades(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT n.id, n.reporte_id, n.tipo, n.descripcion, n.foto, n.creado_en AS creadoEn,
              n.respuesta_admin AS respuestaAdmin, n.respondido_en AS respondidoEn,
              r.titulo AS reporteTitulo
       FROM novedades n
       JOIN reportes r ON n.reporte_id = r.id
       WHERE n.empleado_id = ? AND r.estado != 'resuelto'
       ORDER BY n.creado_en DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Empleado: ver sus avances registrados
async function getMisAvances(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT av.id, av.reporte_id, av.descripcion, av.porcentaje, av.creado_en AS creadoEn,
              r.titulo AS reporteTitulo
       FROM avances av
       JOIN reportes r ON av.reporte_id = r.id
       WHERE av.empleado_id = ? AND r.estado != 'resuelto'
       ORDER BY av.creado_en DESC`,
      [req.user.id]
    );
    res.json(rows);
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
        `🔧 El empleado inició la ejecución del reporte "${reporte.titulo}".`,
        `/reporte/${reporteId}`
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
        `✅ El empleado propone cerrar el reporte "${reporte.titulo}". Revisá la foto y validá el cierre.`,
        `/reporte/${reporteId}`
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
      `✅ Tu reporte "${reporte.titulo}" fue resuelto por el municipio.`,
      `/reporte/${reporteId}`
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
        `❌ El admin rechazó el cierre del reporte "${reporte.titulo}".${motivo ? ` Motivo: ${motivo}` : ''} Debés completar la obra y volver a proponer cierre.`,
        `/panel-empleado`
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

// Admin: estadísticas de todos los empleados
async function getEstadisticasEmpleados(req, res) {
  try {
    const [empleados] = await pool.query(
      "SELECT id, nombre AS name, avatar, nombre_usuario AS username FROM usuarios WHERE rol = 'empleado'"
    );

    const stats = await Promise.all(empleados.map(async (emp) => {
      const [resueltos] = await pool.query(
        `SELECT COUNT(*) AS total FROM asignaciones a
         JOIN reportes r ON a.reporte_id = r.id
         WHERE a.empleado_id = ? AND r.estado = 'resuelto'`, [emp.id]
      );
      const [enCurso] = await pool.query(
        `SELECT COUNT(*) AS total FROM asignaciones a
         JOIN reportes r ON a.reporte_id = r.id
         WHERE a.empleado_id = ? AND r.estado_interno IN ('asignado','en_ejecucion','bloqueado','pendiente_validacion')`, [emp.id]
      );
      const [novedades] = await pool.query(
        'SELECT COUNT(*) AS total FROM novedades WHERE empleado_id = ?', [emp.id]
      );
      const [avances] = await pool.query(
        'SELECT COUNT(*) AS total FROM avances WHERE empleado_id = ?', [emp.id]
      );
      // Tiempo promedio de resolución (días)
      const [tiempoPromedio] = await pool.query(
        `SELECT AVG(DATEDIFF(r.actualizado_en, a.asignado_en)) AS promedio
         FROM asignaciones a
         JOIN reportes r ON a.reporte_id = r.id
         WHERE a.empleado_id = ? AND r.estado = 'resuelto'`, [emp.id]
      );

      return {
        ...emp,
        resueltos: resueltos[0].total,
        enCurso: enCurso[0].total,
        novedades: novedades[0].total,
        avances: avances[0].total,
        tiempoPromedio: tiempoPromedio[0].promedio ? Math.round(tiempoPromedio[0].promedio) : null,
      };
    }));

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getEmpleados, crearEmpleado, editarEmpleado, toggleEmpleado, getMiPerfilEmpleado, getPerfilEmpleado, getEstadisticasEmpleados, asignar, getMisAsignaciones, getMisNovedades, getMisAvances, marcarEnEjecucion, proponerCierre, validarCierre, rechazarCierre, getAsignacionesReporte };
