import { request } from '../utils/request';

export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const register = (username, password, name, email, avatar) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, name, email, avatar }) });

export const verificarEmail = (token) =>
  request(`/auth/verificar/${token}`);

export const updateProfile = (id, data) =>
  request(`/auth/profile/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const cambiarContrasena = (currentPassword, newPassword) =>
  request('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });

export const triggerPasswordReset = (userId) =>
  request(`/auth/reset-for-user/${userId}`, { method: 'POST' });
