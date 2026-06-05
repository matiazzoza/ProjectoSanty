const pool = require('../db');

async function getDashboard(req, res) {
  try {
    // ── Estado general de reportes ────────────────────────────
    const [[totales]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(estado = 'pendiente')  AS pendientes,
        SUM(estado = 'en_proceso') AS enProceso,
        SUM(estado = 'resuelto')   AS resueltos,
        SUM(estado = 'duplicado')  AS duplicados
      FROM reportes
    `);

    // Pendientes sin asignar
    const [[{ sinAsignar }]] = await pool.query(`
      SELECT COUNT(*) AS sinAsignar
      FROM reportes r
      WHERE r.estado = 'pendiente'
        AND NOT EXISTS (SELECT 1 FROM asignaciones a WHERE a.reporte_id = r.id AND a.activo = 1)
    `);

    // ── Alertas ───────────────────────────────────────────────

    // Reportes con fecha límite vencida (en curso)
    const [vencidos] = await pool.query(`
      SELECT r.id, r.titulo, a.fecha_limite, u.nombre AS empleado
      FROM asignaciones a
      JOIN reportes r ON r.id = a.reporte_id
      JOIN usuarios u ON u.id = a.empleado_id
      WHERE a.fecha_limite < CURDATE()
        AND r.estado NOT IN ('resuelto','duplicado')
      ORDER BY a.fecha_limite ASC
      LIMIT 10
    `);

    // Novedades bloqueantes sin responder
    const [bloqueantes] = await pool.query(`
      SELECT n.id, n.descripcion, n.creado_en, r.id AS reporteId, r.titulo AS reporteTitulo, u.nombre AS empleado
      FROM novedades n
      JOIN reportes r ON r.id = n.reporte_id
      JOIN usuarios u ON u.id = n.empleado_id
      WHERE n.tipo = 'bloqueante'
        AND n.respuesta_admin IS NULL
        AND r.estado NOT IN ('resuelto','duplicado')
      ORDER BY n.creado_en ASC
      LIMIT 10
    `);

    // Reportes abandonados (pendiente, más de 30 días sin movimiento)
    const [abandonados] = await pool.query(`
      SELECT r.id, r.titulo, r.creado_en,
             DATEDIFF(NOW(), r.creado_en) AS dias
      FROM reportes r
      WHERE r.estado = 'pendiente'
        AND DATEDIFF(NOW(), r.creado_en) >= 30
      ORDER BY dias DESC
      LIMIT 10
    `);

    // ── Rendimiento empleados ────────────────────────────────
    const [empleados] = await pool.query(`
      SELECT u.id, u.nombre, u.avatar,
        SUM(a.es_lider = 1)                                                                   AS totalComoLider,
        SUM(a.es_lider = 0 AND a.aprobado = 'aprobado')                                      AS totalComoMiembro,
        SUM(r.estado = 'resuelto' AND a.es_lider = 1)                                        AS resueltosComoLider,
        SUM(r.estado = 'resuelto' AND a.es_lider = 0 AND a.aprobado = 'aprobado')            AS participacionesComoMiembro,
        SUM(r.estado = 'en_proceso' AND a.aprobado = 'aprobado' AND a.activo = 1)           AS enCurso,
        (SELECT COUNT(*) FROM avances av WHERE av.empleado_id = u.id)                         AS avances,
        (SELECT COUNT(*) FROM novedades nv WHERE nv.empleado_id = u.id)                       AS novedades
      FROM usuarios u
      JOIN asignaciones a ON a.empleado_id = u.id
      JOIN reportes r ON r.id = a.reporte_id
      WHERE u.rol = 'empleado'
      GROUP BY u.id, u.nombre, u.avatar
      ORDER BY resueltosComoLider DESC
    `);

    // ── Rendimiento admins ───────────────────────────────────
    const [adminsRaw] = await pool.query(`
      SELECT u.id, u.nombre, u.avatar, u.rol,
        (SELECT COUNT(DISTINCT h.reporte_id) FROM historial_estados h WHERE h.cambiado_por = u.id AND h.estado_nuevo = 'en_proceso') AS reportesAtendidos,
        (SELECT COUNT(*)                     FROM historial_estados h WHERE h.cambiado_por = u.id AND h.estado_nuevo = 'en_proceso') AS asignacionesRealizadas,
        (SELECT COUNT(*)                     FROM novedades n        WHERE n.respondido_por = u.id)                                  AS novedadesRespondidas,
        (SELECT ROUND(AVG(DATEDIFF(n.respondido_en, n.creado_en)),1) FROM novedades n WHERE n.respondido_por = u.id AND n.respondido_en IS NOT NULL) AS promedioRespuesta
      FROM usuarios u
      WHERE u.rol IN ('admin','superadmin')
      ORDER BY reportesAtendidos DESC
    `);
    const admins = adminsRaw.map((a) => ({
      ...a,
      reasignaciones: Number(a.asignacionesRealizadas) - Number(a.reportesAtendidos),
    }));

    // ── Actividad reciente ───────────────────────────────────
    const [actividadReciente] = await pool.query(`
      SELECT h.id, h.estado_anterior, h.estado_nuevo, h.cambiado_en,
             u.nombre AS quien, r.id AS reporteId, r.titulo AS reporteTitulo
      FROM historial_estados h
      JOIN usuarios u ON u.id = h.cambiado_por
      JOIN reportes r ON r.id = h.reporte_id
      ORDER BY h.cambiado_en DESC
      LIMIT 8
    `);

    res.json({
      totales: { ...totales, sinAsignar },
      alertas: { vencidos, bloqueantes, abandonados },
      rendimiento: { empleados, admins },
      actividadReciente,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener el dashboard.' });
  }
}

async function buildPerfilAdmin(id) {
  const [rows] = await pool.query(
    `SELECT id, nombre AS name, nombre_usuario AS username, avatar, rol
     FROM usuarios WHERE id = ? AND rol IN ('admin','superadmin')`, [id]
  );
  if (!rows[0]) return null;
  const admin = rows[0];

  const [[{ reportesAtendidos }]] = await pool.query(
    `SELECT COUNT(DISTINCT reporte_id) AS reportesAtendidos
     FROM historial_estados WHERE cambiado_por = ? AND estado_nuevo = 'en_proceso'`, [id]
  );
  const [[{ asignacionesRealizadas }]] = await pool.query(
    `SELECT COUNT(*) AS asignacionesRealizadas
     FROM historial_estados WHERE cambiado_por = ? AND estado_nuevo = 'en_proceso'`, [id]
  );
  const [[{ novedadesRespondidas }]] = await pool.query(
    `SELECT COUNT(*) AS novedadesRespondidas FROM novedades WHERE respondido_por = ?`, [id]
  );
  const [[{ promedioRespuesta }]] = await pool.query(
    `SELECT ROUND(AVG(DATEDIFF(respondido_en, creado_en)), 1) AS promedioRespuesta
     FROM novedades WHERE respondido_por = ? AND respondido_en IS NOT NULL`, [id]
  );
  const [actividadReciente] = await pool.query(
    `SELECT h.id, h.estado_anterior, h.estado_nuevo, h.cambiado_en,
            r.id AS reporteId, r.titulo AS reporteTitulo, r.categoria AS reporteCategoria
     FROM historial_estados h
     JOIN reportes r ON r.id = h.reporte_id
     WHERE h.cambiado_por = ?
     ORDER BY h.cambiado_en DESC
     LIMIT 10`, [id]
  );
  const [listaAtendidos] = await pool.query(
    `SELECT r.id, r.titulo AS title, r.categoria AS category, r.estado AS status,
            b.nombre AS barrioNombre, MIN(h.cambiado_en) AS fechaAsignacion
     FROM historial_estados h
     JOIN reportes r ON r.id = h.reporte_id
     LEFT JOIN barrios b ON r.barrio_id = b.id
     WHERE h.cambiado_por = ? AND h.estado_nuevo = 'en_proceso'
     GROUP BY r.id, r.titulo, r.categoria, r.estado, b.nombre
     ORDER BY fechaAsignacion DESC
     LIMIT 30`, [id]
  );
  const [listaReasignaciones] = await pool.query(
    `SELECT r.id, r.titulo AS title, r.categoria AS category, r.estado AS status,
            b.nombre AS barrioNombre, COUNT(*) AS vecesAsignado
     FROM historial_estados h
     JOIN reportes r ON r.id = h.reporte_id
     LEFT JOIN barrios b ON r.barrio_id = b.id
     WHERE h.cambiado_por = ? AND h.estado_nuevo = 'en_proceso'
     GROUP BY r.id, r.titulo, r.categoria, r.estado, b.nombre
     HAVING COUNT(*) > 1
     ORDER BY vecesAsignado DESC`, [id]
  );
  const [listaNovedades] = await pool.query(
    `SELECT n.id, n.tipo, n.descripcion, n.respuesta_admin AS respuesta,
            n.creado_en AS creadoEn, n.respondido_en AS respondidoEn,
            DATEDIFF(n.respondido_en, n.creado_en) AS diasRespuesta,
            r.id AS reporteId, r.titulo AS reporteTitulo
     FROM novedades n
     JOIN reportes r ON r.id = n.reporte_id
     WHERE n.respondido_por = ?
     ORDER BY n.respondido_en DESC
     LIMIT 30`, [id]
  );

  const reasignaciones = Number(asignacionesRealizadas) - Number(reportesAtendidos);
  return {
    admin,
    stats: {
      reportesAtendidos:    Number(reportesAtendidos),
      reasignaciones,
      novedadesRespondidas: Number(novedadesRespondidas),
      promedioRespuesta:    promedioRespuesta !== null ? Number(promedioRespuesta) : null,
    },
    actividadReciente,
    listaAtendidos,
    listaReasignaciones,
    listaNovedades,
  };
}

async function getPerfilAdmin(req, res) {
  try {
    const data = await buildPerfilAdmin(req.params.id);
    if (!data) return res.status(404).json({ error: 'Admin no encontrado.' });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener el perfil del admin.' });
  }
}

async function getMiPerfilAdmin(req, res) {
  try {
    const data = await buildPerfilAdmin(req.user.id);
    if (!data) return res.status(404).json({ error: 'Admin no encontrado.' });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener el perfil.' });
  }
}

module.exports = { getDashboard, getPerfilAdmin, getMiPerfilAdmin };
