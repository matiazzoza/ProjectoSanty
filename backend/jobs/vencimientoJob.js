const { randomUUID } = require('crypto');
const Reporte = require('../models/Reporte');
const Notificacion = require('../models/Notificacion');

async function verificarReportesVencidos() {
  try {
    const proximos = await Reporte.getProximosAVencer();
    for (const reporte of proximos) {
      if (reporte.liderId) {
        await Notificacion.create(
          randomUUID(), reporte.liderId,
          `⚠️ El reporte "${reporte.titulo}" lleva 5 días sin actividad. Registrá un avance para mantenerlo al día.`,
          `/reporte/${reporte.id}`
        );
      }
      console.log(`[VencimientoJob] Advertencia enviada para "${reporte.titulo}".`);
    }
  } catch (err) {
    console.error('[VencimientoJob] Error:', err.message);
  }
}

function iniciar() {
  verificarReportesVencidos();
  setInterval(verificarReportesVencidos, 60 * 60 * 1000);
}

module.exports = { iniciar };
