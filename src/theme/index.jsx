import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import asu from './asu';
import md24 from './md24';

export const THEMES = { md24, asu };

/** Глобальный масштаб шрифтов (1.2 = +20 %). Применяется ко всем размерам текста через fs(). */
export const FONT_SCALE = 1.2;
export const fs = (n) => Math.round(n * FONT_SCALE * 10) / 10;
const KEY = 'asu_light_theme';
const ThemeContext = createContext({ theme: md24, setThemeKey: () => {} });

export function ThemeProvider({ children }) {
  const [key, setKey] = useState('md24');
  useEffect(() => { AsyncStorage.getItem(KEY).then((v) => { if (v && THEMES[v]) setKey(v); }); }, []);
  const value = useMemo(() => ({
    theme: THEMES[key],
    themeKey: key,
    setThemeKey: (k) => { if (THEMES[k]) { setKey(k); AsyncStorage.setItem(KEY, k); } },
  }), [key]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
