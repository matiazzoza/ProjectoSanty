import { request } from '../utils/request';

export const getByReporte = (reporteId) => request(`/novedades/reporte/${reporteId}`);
export const create = (reporteId, { tipo, descripcion, foto }) =>
  request(`/novedades/reporte/${reporteId}`, {
    method: 'POST',
    body: JSON.stringify({ tipo, descripcion, foto: foto ?? null }),
  });
