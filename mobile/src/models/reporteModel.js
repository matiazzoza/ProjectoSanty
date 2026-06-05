import { request } from '../utils/request';

export const getAll = () => request('/reports');
export const getById = (id) => request(`/reports/${id}`);
export const create = ({ title, description, category, address, lat, lng, photo, authorId, barrioId }) =>
  request('/reports', {
    method: 'POST',
    body: JSON.stringify({
      title, description, category, photo, authorId, barrioId: barrioId ?? null,
      location: { address, lat, lng },
    }),
  });
export const toggleVote = (reportId, userId) =>
  request(`/reports/${reportId}/vote`, { method: 'POST', body: JSON.stringify({ userId }) });
export const addComment = (reportId, data) =>
  request(`/reports/${reportId}/comments`, { method: 'POST', body: JSON.stringify(data) });
export const deleteComment = (reportId, commentId) =>
  request(`/reports/${reportId}/comments/${commentId}`, { method: 'DELETE' });
export const getHistorial = (reportId) =>
  request(`/reports/${reportId}/historial`);
export const cancelarReporte = (id, motivo) =>
  request(`/reports/${id}/cancelar`, { method: 'PUT', body: JSON.stringify({ motivo }) });
export const verificarReporte = (id, resultado, foto, nota) =>
  request(`/reports/${id}/verificar`, { method: 'PUT', body: JSON.stringify({ resultado, foto, nota }) });
export const getMisVerificaciones = () => request('/reports/mis-verificaciones');
