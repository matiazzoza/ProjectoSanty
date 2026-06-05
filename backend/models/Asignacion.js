const pool = require('../db');

async function getByReporte(reporteId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.reporte_id, a.empleado_id, a.es_lider, a.aprobado, a.asignado_en, a.prioridad,
            a.fecha_limite AS fechaLimite,
            u.nombre AS empleado_nombre, u.avatar AS empleado_avatar,
            GROUP_CONCAT(ue.especialidad ORDER BY ue.especialidad SEPARATOR ',') AS _esp
     FROM asignaciones a
     JOIN usuarios u ON a.empleado_id = u.id
     LEFT JOIN usuario_especialidades ue ON ue.usuario_id = a.empleado_id
     WHERE a.reporte_id = ? AND a.activo = 1
     GROUP BY a.id, a.reporte_id, a.empleado_id, a.es_lider, a.aprobado, a.asignado_en, a.prioridad, a.fecha_limite, u.nombre, u.avatar
     ORDER BY a.es_lider DESC, a.asignado_en ASC`,
    [reporteId]
  );
  return rows.map((r) => ({ ...r, especialidades: r._esp ? r._esp.split(',') : [], _esp: undefined }));
}

async function getByEmpleado(empleadoId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.reporte_id, a.es_lider, a.aprobado, a.asignado_en, a.prioridad, a.fecha_limite AS fechaLimite,
            r.titulo AS title, r.descripcion AS description, r.categoria AS category,
            r.estado AS status, r.estado_interno AS estadoInterno,
            r.latitud AS lat, r.longitud AS lng, r.direccion AS address,
            r.foto, r.foto_campo AS fotoCampo, r.foto_resolucion AS fotoResolucion,
            r.creado_en AS createdAt, r.barrio_id AS barrioId,
            b.nombre AS barrioNombre, u.nombre AS authorName,
            (SELECT av.porcentaje FROM avances av WHERE av.reporte_id = r.id ORDER BY av.creado_en DESC LIMIT 1) AS ultimoPorcentaje,
            (SELECT u2.nombre FROM asignaciones a2 JOIN usuarios u2 ON a2.empleado_id = u2.id
             WHERE a2.reporte_id = r.id AND a2.es_lider = 1 AND a2.activo = 1 LIMIT 1) AS liderNombre,
            (SELECT COUNT(*) FROM asignaciones a3
             WHERE a3.reporte_id = r.id AND a3.activo = 1 AND a3.aprobado = 'aprobado') AS totalMiembros
     FROM asignaciones a
     JOIN reportes r ON a.reporte_id = r.id
     LEFT JOIN barrios b ON r.barrio_id = b.id
     JOIN usuarios u ON r.autor_id = u.id
     WHERE a.empleado_id = ? AND a.aprobado != 'baja_pendiente' AND a.activo = 1
       AND r.estado NOT IN ('resuelto', 'duplicado')
     ORDER BY FIELD(a.prioridad, 'alta', 'media', 'baja'), a.asignado_en DESC`,
    [empleadoId]
  );
  return rows.map((r) => ({
    ...r,
    location: { lat: parseFloat(r.lat), lng: parseFloat(r.lng), address: r.address },
    barrio: r.barrioId ? { id: r.barrioId, nombre: r.barrioNombre } : null,
    totalMiembros: Number(r.totalMiembros),
  }));
}

async function create(id, reporteId, empleadoId, esLider = true, prioridad = 'media', fechaLimite = null, aprobado = 'aprobado') {
  await pool.query(
    'INSERT INTO asignaciones (id, reporte_id, empleado_id, es_lider, prioridad, fecha_limite, aprobado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, reporteId, empleadoId, esLider ? 1 : 0, prioridad, fechaLimite, aprobado]
  );
}

async function removeByReporte(reporteId) {
  await pool.query('DELETE FROM asignaciones WHERE reporte_id = ? AND activo = 1', [reporteId]);
}

async function getHistorialByReporte(reporteId) {
  const [rows] = await pool.query(
    `SELECT a.empleado_id, a.es_lider, a.asignado_en,
            u.nombre AS empleado_nombre, u.avatar AS empleado_avatar
     FROM asignaciones a
     JOIN usuarios u ON a.empleado_id = u.id
     WHERE a.reporte_id = ? AND a.activo = 0
     ORDER BY a.asignado_en DESC`,
    [reporteId]
  );
  return rows;
}

module.exports = { getByReporte, getByEmpleado, create, removeByReporte, getHistorialByReporte };
