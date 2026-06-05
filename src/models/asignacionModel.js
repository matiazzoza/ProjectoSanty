import { request } from '../utils/request';

export const getEmpleados = () => request('/asignaciones/empleados');
export const getEstadisticasEmpleados = () => request('/asignaciones/empleados/estadisticas');

export const crearEmpleado = (data) =>
  request('/asignaciones/empleados', { method: 'POST', body: JSON.stringify(data) });

export const toggleEmpleado = (id) =>
  request(`/asignaciones/empleados/${id}/toggle`, { method: 'PATCH' });

export const editarEmpleado = (id, data) =>
  request(`/asignaciones/empleados/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const getPerfilEmpleado = (id) =>
  request(`/asignaciones/empleados/${id}/perfil`);

export const getPerfilEmpleadoCompleto = (id) =>
  request(`/asignaciones/empleados/${id}/perfil-completo`);

export const asignar = (reporteId, empleadoId, prioridad = 'media', fechaLimite = null, miembros = []) =>
  request('/asignaciones/asignar', { method: 'POST', body: JSON.stringify({ reporteId, empleadoId, prioridad, fechaLimite, miembros }) });

export const getMiPerfilEmpleado = () => request('/asignaciones/mi-perfil-empleado');

export const getMisAsignaciones = () => request('/asignaciones/mis-asignaciones');
export const getMisNovedades = () => request('/asignaciones/mis-novedades');
export const getMisAvances = () => request('/asignaciones/mis-avances');

export const getAsignacionesReporte = (reporteId) => request(`/asignaciones/reporte/${reporteId}`);
export const getHistorialAsignacionesReporte = (reporteId) => request(`/asignaciones/reporte/${reporteId}/historial`);

export const getEmpleadosDisponibles = () => request('/asignaciones/empleados-disponibles');
export const getMiEquipo = (reporteId) => request(`/asignaciones/mi-equipo/${reporteId}`);
export const proponerMiembro = (reporteId, empleadoId) =>
  request('/asignaciones/proponer-miembro', { method: 'POST', body: JSON.stringify({ reporteId, empleadoId }) });
export const proponerBaja = (reporteId, empleadoId) =>
  request('/asignaciones/proponer-baja', { method: 'POST', body: JSON.stringify({ reporteId, empleadoId }) });
export const resolverPropuesta = (reporteId, empleadoId, accion) =>
  request('/asignaciones/resolver-propuesta', { method: 'POST', body: JSON.stringify({ reporteId, empleadoId, accion }) });

export const marcarEnEjecucion = (reporteId, fotoCampo = null) =>
  request(`/asignaciones/en-ejecucion/${reporteId}`, { method: 'POST', body: JSON.stringify({ fotoCampo }) });

export const proponerCierre = (reporteId, fotoResolucion) =>
  request(`/asignaciones/proponer-cierre/${reporteId}`, { method: 'POST', body: JSON.stringify({ fotoResolucion }) });

export const validarCierre = (reporteId) =>
  request(`/asignaciones/validar/${reporteId}`, { method: 'POST' });

export const rechazarCierre = (reporteId, motivo = '') =>
  request(`/asignaciones/rechazar/${reporteId}`, { method: 'POST', body: JSON.stringify({ motivo }) });
