import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LIGHT = {
  bg: '#f1f5f9',
  card: '#ffffff',
  cardAlt: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  textSubtle: '#94a3b8',
  border: '#e2e8f0',
  inputBg: '#f8fafc',
  accent: '#2563eb',
  accentLight: '#eff6ff',
  separator: '#f1f5f9',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  dangerText: '#7f1d1d',
  success: '#16a34a',
  successLight: '#f0fdf4',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningText: '#92400e',
};

export const DARK = {
  bg: '#0f172a',
  card: '#1e293b',
  cardAlt: '#1e293b',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  textSubtle: '#64748b',
  border: '#334155',
  inputBg: '#1e293b',
  accent: '#3b82f6',
  accentLight: '#1e3a5f',
  separator: '#0f172a',
  danger: '#f87171',
  dangerLight: '#450a0a',
  dangerText: '#fca5a5',
  success: '#4ade80',
  successLight: '#052e16',
  warning: '#fbbf24',
  warningLight: '#451a03',
  warningText: '#fde68a',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then((v) => { if (v === 'dark') setIsDark(true); });
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  }

  const value = useMemo(() => ({ isDark, toggle, c: isDark ? DARK : LIGHT }), [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
