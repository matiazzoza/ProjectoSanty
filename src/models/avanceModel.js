import { request } from '../utils/request';

export const getAvances = (reporteId) => request(`/avances/reporte/${reporteId}`);

export const registrarAvance = (reporteId, data) =>
  request(`/avances/reporte/${reporteId}`, { method: 'POST', body: JSON.stringify(data) });
