import { request } from '../utils/request';

export const getByUsuario = (usuarioId) => request(`/seguimientos/${usuarioId}`);
export const toggle = (reporteId, usuarioId) =>
  request(`/reports/${reporteId}/seguir`, { method: 'POST', body: JSON.stringify({ usuarioId }) });
