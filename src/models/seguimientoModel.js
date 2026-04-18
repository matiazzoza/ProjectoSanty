import { request } from '../utils/request';

export const toggle = (reporteId, usuarioId) =>
  request(`/reports/${reporteId}/seguir`, { method: 'POST', body: JSON.stringify({ usuarioId }) });

export const getByUsuario = (usuarioId) =>
  request(`/seguimientos/${usuarioId}`);
