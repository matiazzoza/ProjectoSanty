const { v4: uuidv4 } = require('uuid');
const Reporte = require('../models/Reporte');
const Notificacion = require('../models/Notificacion');

async function verificarReportesVencidos() {
  try {
    const vencidos = await Reporte.getVencidos();

    for (const reporte of vencidos) {
      await Reporte.resetAPendiente(reporte.id);

      const msg = `El reporte "${reporte.titulo}" estuvo más de 7 días en proceso sin resolverse y volvió a estado Pendiente.`;
      await Notificacion.create(uuidv4(), 'u1', `[Admin] ${msg}`);
      if (reporte.autor_id !== 'u1') {
        await Notificacion.create(uuidv4(), reporte.autor_id, msg);
      }

      console.log(`[Job] Reporte "${reporte.titulo}" volvió a pendiente.`);
    }
  } catch (err) {
    console.error('[Job] Error verificando reportes:', err.message);
  }
}

function iniciar() {
  verificarReportesVencidos();
  setInterval(verificarReportesVencidos, 60 * 60 * 1000);
}

module.exports = { iniciar };
