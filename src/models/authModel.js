import { request } from '../utils/request';

export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const register = (username, password, name) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, name }) });

export const updateProfile = (id, data) =>
  request(`/auth/profile/${id}`, { method: 'PUT', body: JSON.stringify(data) });
