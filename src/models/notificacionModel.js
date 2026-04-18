import { request } from '../utils/request';

export const getAll = (userId) => request(`/notifications/${userId}`);
export const marcarLeida = (id) => request(`/notifications/${id}/leida`, { method: 'PUT' });
export const crearAlerta = (mensaje) =>
  request('/notifications/alerta', { method: 'POST', body: JSON.stringify({ mensaje }) });
