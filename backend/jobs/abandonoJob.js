const { randomUUID } = require('crypto');
const pool = require('../db');
const Notificacion = require('../models/Notificacion');

async function getReportesAbandonados(dias) {
  const [rows] = await pool.query(
    `SELECT r.id, r.titulo, r.autor_id
     FROM reportes r
     WHERE r.estado = 'pendiente'
       AND DATEDIFF(NOW(), r.creado_en) = ?`,
    [dias]
  );
  return rows;
}

async function verificarAbandono() {
  try {
    // Aviso a los 15 días
    const en15 = await getReportesAbandonados(15);
    for (const r of en15) {
      await Notificacion.create(
        randomUUID(), r.autor_id,
        `⏳ Tu reporte "${r.titulo}" lleva 15 días sin respuesta del municipio. Podés compartirlo para conseguir más apoyo.`
      );
    }

    // Crítico a los 30 días
    const en30 = await getReportesAbandonados(30);
    for (const r of en30) {
      await Notificacion.create(
        randomUUID(), r.autor_id,
        `🚨 Tu reporte "${r.titulo}" lleva 30 días sin respuesta del municipio. Te recomendamos compartirlo o contactar directamente al municipio.`
      );
    }
  } catch (err) {
    console.error('[AbandonoJob] Error:', err.message);
  }
}

function iniciar() {
  verificarAbandono();
  // Corre una vez por día
  setInterval(verificarAbandono, 24 * 60 * 60 * 1000);
}

module.exports = { iniciar };
