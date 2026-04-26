import { request } from '../utils/request';

export const getAllNovedades = () => request('/novedades');
export const getNovedades = (reporteId) => request(`/novedades/reporte/${reporteId}`);

export const cargarNovedad = (reporteId, data) =>
  request(`/novedades/reporte/${reporteId}`, { method: 'POST', body: JSON.stringify(data) });

export const responderNovedad = (novedadId, respuesta) =>
  request(`/novedades/responder/${novedadId}`, { method: 'POST', body: JSON.stringify({ respuesta }) });
