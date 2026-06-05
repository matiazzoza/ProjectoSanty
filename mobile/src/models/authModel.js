import { request } from '../utils/request';

export const login = (username, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const register = (data) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(data) });

export const getMe = () => request('/auth/me');
