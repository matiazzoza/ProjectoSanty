import { request } from '../utils/request';

export const enviarMensaje = (contenido, reporteId = null, contexto = null) =>
  request('/mensajes-admin', { method: 'POST', body: JSON.stringify({ contenido, reporteId, contexto }) });

export const getMisMensajes = () => request('/mensajes-admin/mis-mensajes');

export const getMensajes = () => request('/mensajes-admin');

export const marcarLeido = (id) =>
  request(`/mensajes-admin/${id}/leido`, { method: 'PATCH' });
