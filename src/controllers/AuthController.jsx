import { createContext, useContext, useState, useEffect } from 'react';
import * as authModel from '../models/authModel';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  async function login(username, password) {
    try {
      const { user, token } = await authModel.login(username, password);
      localStorage.setItem('auth_token', token);
      setCurrentUser(user);
      setError('');
      return user.role === 'superadmin' ? 'superadmin' : user.role === 'admin' ? 'admin' : user.role === 'empleado' ? 'empleado' : true;
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos.');
      return false;
    }
  }

  async function register(username, password, name, email, avatar) {
    try {
      const result = await authModel.register(username, password, name, email, avatar);
      if (result.pendingVerification) {
        setError('');
        return 'pending';
      }
      setError('');
      return true;
    } catch (err) {
      setError(err.message || 'Error al registrar el usuario.');
      return false;
    }
  }

  function logout() {
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
  }

  async function updateProfile({ name, avatar }) {
    try {
      const updated = await authModel.updateProfile(currentUser.id, { name, avatar });
      setCurrentUser(updated);
    } catch (err) {
      console.error('Error actualizando perfil:', err);
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, error, setError, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
