import { request } from '../utils/request';

export const getEmpleados = () => request('/asignaciones/empleados');

export const asignar = (reporteId, empleadoId) =>
  request('/asignaciones/asignar', { method: 'POST', body: JSON.stringify({ reporteId, empleadoId }) });

export const getMisAsignaciones = () => request('/asignaciones/mis-asignaciones');

export const getAsignacionesReporte = (reporteId) => request(`/asignaciones/reporte/${reporteId}`);

export const marcarEnEjecucion = (reporteId, fotoCampo = null) =>
  request(`/asignaciones/en-ejecucion/${reporteId}`, { method: 'POST', body: JSON.stringify({ fotoCampo }) });

export const proponerCierre = (reporteId, fotoResolucion) =>
  request(`/asignaciones/proponer-cierre/${reporteId}`, { method: 'POST', body: JSON.stringify({ fotoResolucion }) });

export const validarCierre = (reporteId) =>
  request(`/asignaciones/validar/${reporteId}`, { method: 'POST' });

export const rechazarCierre = (reporteId, motivo = '') =>
  request(`/asignaciones/rechazar/${reporteId}`, { method: 'POST', body: JSON.stringify({ motivo }) });
