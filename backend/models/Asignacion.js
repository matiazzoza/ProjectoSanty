const pool = require('../db');

async function getByReporte(reporteId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.reporte_id, a.empleado_id, a.es_lider, a.asignado_en,
            u.nombre AS empleado_nombre, u.avatar AS empleado_avatar
     FROM asignaciones a
     JOIN usuarios u ON a.empleado_id = u.id
     WHERE a.reporte_id = ?
     ORDER BY a.es_lider DESC, a.asignado_en ASC`,
    [reporteId]
  );
  return rows;
}

async function getByEmpleado(empleadoId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.reporte_id, a.es_lider, a.asignado_en,
            r.titulo AS title, r.descripcion AS description, r.categoria AS category,
            r.estado AS status, r.estado_interno AS estadoInterno,
            r.latitud AS lat, r.longitud AS lng, r.direccion AS address,
            r.foto, r.foto_campo AS fotoCampo, r.foto_resolucion AS fotoResolucion,
            r.creado_en AS createdAt, r.barrio_id AS barrioId,
            b.nombre AS barrioNombre, u.nombre AS authorName
     FROM asignaciones a
     JOIN reportes r ON a.reporte_id = r.id
     LEFT JOIN barrios b ON r.barrio_id = b.id
     JOIN usuarios u ON r.autor_id = u.id
     WHERE a.empleado_id = ?
     ORDER BY a.asignado_en DESC`,
    [empleadoId]
  );
  return rows.map((r) => ({
    ...r,
    location: { lat: parseFloat(r.lat), lng: parseFloat(r.lng), address: r.address },
    barrio: r.barrioId ? { id: r.barrioId, nombre: r.barrioNombre } : null,
  }));
}

async function create(id, reporteId, empleadoId, esLider = true) {
  await pool.query(
    'INSERT INTO asignaciones (id, reporte_id, empleado_id, es_lider) VALUES (?, ?, ?, ?)',
    [id, reporteId, empleadoId, esLider ? 1 : 0]
  );
}

async function removeByReporte(reporteId) {
  await pool.query('DELETE FROM asignaciones WHERE reporte_id = ?', [reporteId]);
}

module.exports = { getByReporte, getByEmpleado, create, removeByReporte };
