import { request } from '../utils/request';

export const getMisAsignaciones    = () => request('/asignaciones/mis-asignaciones');
export const getMiPerfilEmpleado  = () => request('/asignaciones/mi-perfil-empleado');
export const getMiEquipo = (reporteId) => request(`/asignaciones/mi-equipo/${reporteId}`);
export const marcarEnEjecucion = (reporteId, fotoCampo) =>
  request(`/asignaciones/en-ejecucion/${reporteId}`, {
    method: 'POST',
    body: JSON.stringify({ fotoCampo }),
  });
export const proponerCierre = (reporteId, fotoResolucion) =>
  request(`/asignaciones/proponer-cierre/${reporteId}`, {
    method: 'POST',
    body: JSON.stringify({ fotoResolucion }),
  });
export const proponerMiembro = (reporteId, empleadoId) =>
  request('/asignaciones/proponer-miembro', {
    method: 'POST',
    body: JSON.stringify({ reporteId, empleadoId }),
  });
