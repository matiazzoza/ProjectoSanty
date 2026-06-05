import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.81:3001/api';

export async function request(path, options = {}) {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || 'Error en la solicitud');
  }

  return res.json();
}
