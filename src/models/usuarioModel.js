import { request } from '../utils/request';

export const getSuperAdminDashboard = () => request('/super-admin/dashboard');
export const getPerfilAdmin = (id) => request(`/super-admin/admin/${id}/perfil`);
export const getMiPerfilAdmin = () => request('/super-admin/mi-perfil');

export const getAllUsuarios = () => request('/usuarios');

export const createUsuario = (data) =>
  request('/usuarios', { method: 'POST', body: JSON.stringify(data) });

export const updateUsuario = (id, data) =>
  request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteUsuario = (id) =>
  request(`/usuarios/${id}`, { method: 'DELETE' });

export const getEspecialidades = (id) =>
  request(`/usuarios/${id}/especialidades`);

export const setEspecialidades = (id, especialidades) =>
  request(`/usuarios/${id}/especialidades`, { method: 'PUT', body: JSON.stringify({ especialidades }) });
