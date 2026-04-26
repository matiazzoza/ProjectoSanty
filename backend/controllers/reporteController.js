const { v4: uuidv4 } = require('uuid');
const Reporte = require('../models/Reporte');
const Seguimiento = require('../models/Seguimiento');
const Notificacion = require('../models/Notificacion');
const HistorialEstado = require('../models/HistorialEstado');
const { randomUUID } = require('crypto');

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
  try {
    const reporte = await Reporte.create(uuidv4(), { title, description, category, location, photo, authorId, barrioId });
    res.status(201).json(reporte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  const { title, description, category, status, location, photo, barrioId } = req.body;
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

async function getEstadisticasPublicas(req, res) {
  try {
    const stats = await Reporte.getEstadisticasPublicas();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAll, getOne, create, update, remove, getEstadisticasPublicas };
