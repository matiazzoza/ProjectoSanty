import { request } from '../utils/request';

export const getByReporte = (reporteId) => request(`/avances/reporte/${reporteId}`);
export const create = (reporteId, { descripcion, porcentaje, lat, lng }) =>
  request(`/avances/reporte/${reporteId}`, {
    method: 'POST',
    body: JSON.stringify({ descripcion, porcentaje, lat: lat ?? null, lng: lng ?? null }),
  });
