import { createContext, useContext, useState, useEffect } from "react";
import { USERS } from "../data/users";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("currentUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

  function login(username, password) {
    const user = USERS.find(
      (u) => u.username === username && u.password === password
    );
    if (user) {
      const { password: _, ...safeUser } = user;
      // Merge with any saved profile overrides (name, photo)
      const savedProfiles = JSON.parse(localStorage.getItem("userProfiles") || "{}");
      const profileOverrides = savedProfiles[safeUser.id] || {};
      setCurrentUser({ ...safeUser, ...profileOverrides });
      setError("");
      return true;
    }
    setError("Usuario o contraseña incorrectos.");
    return false;
  }

  function logout() {
    setCurrentUser(null);
  }

  function updateProfile({ name, photo }) {
    setCurrentUser((prev) => {
      const updated = {
        ...prev,
        ...(name !== undefined ? { name } : {}),
        ...(photo !== undefined ? { photo } : {}),
      };
      // Persist profile overrides separately so they survive re-login
      const savedProfiles = JSON.parse(localStorage.getItem("userProfiles") || "{}");
      savedProfiles[prev.id] = {
        ...(savedProfiles[prev.id] || {}),
        ...(name !== undefined ? { name } : {}),
        ...(photo !== undefined ? { photo } : {}),
      };
      localStorage.setItem("userProfiles", JSON.stringify(savedProfiles));
      return updated;
    });
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, error, setError, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
