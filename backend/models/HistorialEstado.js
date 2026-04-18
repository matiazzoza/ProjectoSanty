const pool = require('../db');

async function create(id, reporteId, estadoAnterior, estadoNuevo, cambiadoPor) {
  await pool.query(
    'INSERT INTO historial_estados (id, reporte_id, estado_anterior, estado_nuevo, cambiado_por) VALUES (?, ?, ?, ?, ?)',
    [id, reporteId, estadoAnterior, estadoNuevo, cambiadoPor]
  );
}

async function getByReporte(reporteId) {
  const [rows] = await pool.query(
    `SELECT h.id, h.estado_anterior, h.estado_nuevo, h.cambiado_en,
            u.nombre AS cambiadoPorNombre
     FROM historial_estados h
     JOIN usuarios u ON h.cambiado_por = u.id
     WHERE h.reporte_id = ?
     ORDER BY h.cambiado_en ASC`,
    [reporteId]
  );
  return rows;
}

module.exports = { create, getByReporte };
