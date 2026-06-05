import { request } from '../utils/request';

export const getAll = (userId) => request(`/notifications/${userId}`);
export const marcarLeida = (id) => request(`/notifications/${id}/leida`, { method: 'PUT' });
