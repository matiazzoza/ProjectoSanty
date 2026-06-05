const { randomUUID } = require('crypto');
const Reporte = require('../models/Reporte');
const Seguimiento = require('../models/Seguimiento');
const Notificacion = require('../models/Notificacion');
const HistorialEstado = require('../models/HistorialEstado');
const pool = require('../db');
const { contienePalabraProhibida } = require('../utils/filtroTexto');

async function getAll(req, res) {
  try {
    res.json(await Reporte.getAll());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const reporte = await Reporte.getById(req.params.id);
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado.' });
    res.json(reporte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  const { title, description, category, location, photo, authorId, barrioId } = req.body;
  if (contienePalabraProhibida(title) || contienePalabraProhibida(description))
    return res.status(400).json({ error: 'Tu reporte contiene lenguaje inapropiado.' });
  try {
    const reporte = await Reporte.create(randomUUID(), { title, description, category, location, photo, authorId, barrioId });
    res.status(201).json(reporte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  const { title, description, category, status, location, photo, barrioId } = req.body;
  if (contienePalabraProhibida(title) || contienePalabraProhibida(description))
    return res.status(400).json({ error: 'Tu reporte contiene lenguaje inapropiado.' });
  try {
    // Si no es admin y quiere editar datos del reporte (no solo estado), validar que esté pendiente
    if (!status && req.user.role !== 'admin') {
      const actual = await Reporte.getById(req.params.id);
      if (actual && actual.status !== 'pendiente') {
        return res.status(403).json({ error: 'Solo se puede editar un reporte pendiente.' });
      }
    }

    // Guardar estado anterior antes de actualizar
    let estadoAnterior = null;
    if (status) {
      const actual = await Reporte.getById(req.params.id);
      estadoAnterior = actual?.status ?? null;
    }

    const reporte = await Reporte.update(req.params.id, { title, description, category, status, location, photo, barrioId });

    // Registrar historial y notificar si cambió el estado
    if (status) {
      if (status === 'pendiente') {
        await pool.query(
          "UPDATE reportes SET estado_interno = NULL WHERE id = ?",
          [req.params.id]
        );
        await pool.query('UPDATE asignaciones SET activo = 0 WHERE reporte_id = ?', [req.params.id]);
      }

      await HistorialEstado.create(randomUUID(), req.params.id, estadoAnterior, status, req.user.id);

      const ESTADOS = { pendiente: 'Pendiente', en_proceso: 'En proceso', resuelto: 'Resuelto', duplicado: 'Duplicado' };
      const etiqueta = ESTADOS[status] || status;

      // Notificar al autor
      await Notificacion.create(randomUUID(), reporte.authorId,
        `📋 Tu reporte "${reporte.title}" cambió su estado a "${etiqueta}"`,
        `/reporte/${req.params.id}`
      );

      // Notificar seguidores (excepto el autor para no duplicar)
      const seguidores = await Seguimiento.getSeguidores(req.params.id);
      await Promise.all(
        seguidores
          .filter((userId) => userId !== reporte.authorId)
          .map((userId) =>
            Notificacion.create(randomUUID(), userId,
              `📌 El reporte "${reporte.title}" que seguís cambió su estado a "${etiqueta}"`,
              `/reporte/${req.params.id}`
            )
          )
      );
    }

    res.json(reporte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const reporte = await Reporte.getById(req.params.id);
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado.' });

    // Solo el admin puede eliminar reportes que no están pendientes
    if (req.user.role !== 'admin' && reporte.status !== 'pendiente') {
      return res.status(403).json({ error: 'Solo se puede eliminar un reporte pendiente.' });
    }

    await Reporte.remove(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const MOTIVOS_VALIDOS = [
  'fuera_jurisdiccion',
  'problema_inexistente',
  'acceso_denegado',
  'sin_recursos',
  'duplicado',
];

async function cancelarReporte(req, res) {
  const { motivo } = req.body;
  if (!motivo || !MOTIVOS_VALIDOS.includes(motivo))
    return res.status(400).json({ error: 'Motivo de cancelación inválido.' });

  try {
    const reporte = await Reporte.getById(req.params.id);
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado.' });
    if (reporte.status === 'cancelado' || reporte.status === 'resuelto')
      return res.status(400).json({ error: 'El reporte ya está finalizado.' });

    await Reporte.cancelar(req.params.id, motivo);
    await HistorialEstado.create(randomUUID(), req.params.id, reporte.status, 'cancelado', req.user.id);

    const MOTIVOS = {
      fuera_jurisdiccion:  'Fuera de jurisdicción municipal',
      problema_inexistente: 'El problema ya no existe',
      acceso_denegado:     'Acceso al lugar denegado',
      sin_recursos:        'Sin recursos disponibles',
      duplicado:           'Reporte duplicado',
    };
    const etiqueta = MOTIVOS[motivo];

    await Notificacion.create(randomUUID(), reporte.authorId,
      `❌ Tu reporte "${reporte.title}" fue cancelado. Motivo: ${etiqueta}.`,
      `/reporte/${req.params.id}`
    );

    const seguidores = await Seguimiento.getSeguidores(req.params.id);
    await Promise.all(
      seguidores
        .filter((userId) => userId !== reporte.authorId)
        .map((userId) =>
          Notificacion.create(randomUUID(), userId,
            `❌ El reporte "${reporte.title}" que seguís fue cancelado. Motivo: ${etiqueta}.`,
            `/reporte/${req.params.id}`
          )
        )
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function enviarVerificacion(req, res) {
  const { verificadorId } = req.body;
  if (!verificadorId) return res.status(400).json({ error: 'Verificador requerido.' });
  try {
    const reporte = await Reporte.getById(req.params.id);
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado.' });
    if (reporte.status !== 'pendiente')
      return res.status(400).json({ error: 'Solo se puede enviar a verificación un reporte pendiente.' });

    await Reporte.enviarAVerificacion(req.params.id, verificadorId);
    await HistorialEstado.create(randomUUID(), req.params.id, reporte.status, 'en_verificacion', req.user.id);

    await Notificacion.create(randomUUID(), reporte.authorId,
      `📍 Tu reporte "${reporte.title}" está siendo verificado en campo. Te avisaremos cuando tengamos novedades.`,
      `/reporte/${req.params.id}`
    );
    await Notificacion.create(randomUUID(), verificadorId,
      `🔍 Se te asignó verificar el reporte "${reporte.title}". Revisá tu panel.`,
      `/reporte/${req.params.id}`
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function verificarReporte(req, res) {
  const { resultado, foto, nota } = req.body;
  if (!resultado || !['confirma', 'desmiente'].includes(resultado))
    return res.status(400).json({ error: 'Resultado inválido.' });
  try {
    const reporte = await Reporte.getById(req.params.id);
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado.' });
    if (reporte.status !== 'en_verificacion')
      return res.status(400).json({ error: 'El reporte no está en verificación.' });
    if (reporte.verificadorId !== req.user.id)
      return res.status(403).json({ error: 'No sos el verificador asignado.' });

    await Reporte.registrarVerificacion(req.params.id, resultado, foto ?? null, nota ?? null);

    const [admins] = await pool.query("SELECT id FROM usuarios WHERE rol IN ('admin','superadmin')");
    await Promise.all(admins.map((a) =>
      Notificacion.create(randomUUID(), a.id,
        resultado === 'confirma'
          ? `✅ El reporte "${reporte.title}" fue verificado y confirmado. Podés asignar el equipo.`
          : `❌ El reporte "${reporte.title}" fue verificado: el problema no existe o no se encontró.`,
        `/reporte/${req.params.id}`
      )
    ));

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getMisVerificaciones(req, res) {
  try {
    res.json(await Reporte.getMisVerificaciones(req.user.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getEstadisticasPublicas(req, res) {
  try {
    const stats = await Reporte.getEstadisticasPublicas();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getOne, create, update, remove, cancelarReporte, enviarVerificacion, verificarReporte, getMisVerificaciones, getEstadisticasPublicas };
