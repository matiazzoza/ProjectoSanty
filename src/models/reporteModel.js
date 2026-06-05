import { request } from '../utils/request';

export const getAll = () => request('/reports');
export const getById = (id) => request(`/reports/${id}`);
export const create = (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) });
export const update = (id, data) => request(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const remove = (id) => request(`/reports/${id}`, { method: 'DELETE' });
export const toggleVote = (reportId, userId) =>
  request(`/reports/${reportId}/vote`, { method: 'POST', body: JSON.stringify({ userId }) });
export const addComment = (reportId, data) =>
  request(`/reports/${reportId}/comments`, { method: 'POST', body: JSON.stringify(data) });
export const deleteComment = (reportId, commentId) =>
  request(`/reports/${reportId}/comments/${commentId}`, { method: 'DELETE' });

export const getHistorial = (reportId) =>
  request(`/reports/${reportId}/historial`);

export const getEstadisticasPublicas = () => request('/reports/stats');

export const cancelarReporte = (id, motivo) =>
  request(`/reports/${id}/cancelar`, { method: 'PUT', body: JSON.stringify({ motivo }) });

export const enviarVerificacion = (id, verificadorId) =>
  request(`/reports/${id}/enviar-verificacion`, { method: 'PUT', body: JSON.stringify({ verificadorId }) });

export const verificarReporte = (id, resultado, foto, nota) =>
  request(`/reports/${id}/verificar`, { method: 'PUT', body: JSON.stringify({ resultado, foto, nota }) });

export const getMisVerificaciones = () => request('/reports/mis-verificaciones');
