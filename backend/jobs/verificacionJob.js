const { randomUUID } = require('crypto');
const pool = require('../db');
const Notificacion = require('../models/Notificacion');
const { getAdminYSuperadminIds } = require('../utils/dbHelpers');

async function getVerificacionesSinRealizar(dias) {
  const [rows] = await pool.query(
    `SELECT r.id, r.titulo, r.verificador_id
     FROM reportes r
     WHERE r.estado = 'en_verificacion'
       AND r.verificacion_resultado IS NULL
       AND DATEDIFF(NOW(), r.actualizado_en) = ?`,
    [dias]
  );
  return rows;
}

async function getVerificacionesSinDecision(dias) {
  const [rows] = await pool.query(
    `SELECT r.id, r.titulo
     FROM reportes r
     WHERE r.estado = 'en_verificacion'
       AND r.verificacion_resultado IS NOT NULL
       AND DATEDIFF(NOW(), r.actualizado_en) = ?`,
    [dias]
  );
  return rows;
}

async function verificarVerificaciones() {
  try {
    // El verificador todavía no fue al lugar: aviso a los 2 días
    const sinRealizar2 = await getVerificacionesSinRealizar(2);
    for (const r of sinRealizar2) {
      if (!r.verificador_id) continue;
      await Notificacion.create(
        randomUUID(), r.verificador_id,
        `🔍 Recordatorio: tenés pendiente verificar el reporte "${r.titulo}" desde hace 2 días.`,
        `/reporte/${r.id}`
      );
    }

    // Sigue sin verificar a los 5 días: aviso urgente al verificador y se escala a los admins
    const sinRealizar5 = await getVerificacionesSinRealizar(5);
    for (const r of sinRealizar5) {
      if (r.verificador_id) {
        await Notificacion.create(
          randomUUID(), r.verificador_id,
          `🚨 El reporte "${r.titulo}" lleva 5 días esperando tu verificación.`,
          `/reporte/${r.id}`
        );
      }
      const admins = await getAdminYSuperadminIds();
      await Promise.all(admins.map((a) =>
        Notificacion.create(randomUUID(), a.id,
          `🚨 El reporte "${r.titulo}" lleva 5 días sin ser verificado. Considerá reasignar el verificador.`,
          `/reporte/${r.id}`
        )
      ));
    }

    // La verificación ya se hizo, pero nadie decidió qué hacer: aviso a admins a los 3 días
    const sinDecision3 = await getVerificacionesSinDecision(3);
    for (const r of sinDecision3) {
      const admins = await getAdminYSuperadminIds();
      await Promise.all(admins.map((a) =>
        Notificacion.create(randomUUID(), a.id,
          `⚠️ El reporte "${r.titulo}" fue verificado hace 3 días y sigue sin una decisión.`,
          `/reporte/${r.id}`
        )
      ));
    }

    // Sigue sin decisión a los 7 días: aviso urgente
    const sinDecision7 = await getVerificacionesSinDecision(7);
    for (const r of sinDecision7) {
      const admins = await getAdminYSuperadminIds();
      await Promise.all(admins.map((a) =>
        Notificacion.create(randomUUID(), a.id,
          `🚨 El reporte "${r.titulo}" lleva 7 días verificado sin decisión del admin.`,
          `/reporte/${r.id}`
        )
      ));
    }
  } catch (err) {
    console.error('[VerificacionJob] Error:', err.message);
  }
}

function iniciar() {
  verificarVerificaciones();
  // Corre una vez por día
  setInterval(verificarVerificaciones, 24 * 60 * 60 * 1000);
}

module.exports = { iniciar };
