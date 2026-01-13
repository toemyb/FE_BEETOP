import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";

const ThemeCtx = createContext(null);
const LS_KEY = "bee_theme";

export const AppThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#1677ff");

  // load saved theme
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved?.isDark === "boolean") setIsDark(saved.isDark);
      if (typeof saved?.primaryColor === "string") setPrimaryColor(saved.primaryColor);
    } catch {}
  }, []);

  // save theme
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify({ isDark, primaryColor }));
  }, [isDark, primaryColor]);

  const antdConfig = useMemo(
    () => ({
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: { colorPrimary: primaryColor },
    }),
    [isDark, primaryColor]
  );

  const ctxValue = useMemo(
    () => ({
      isDark,
      primaryColor,
      toggleDark: () => setIsDark((v) => !v),
      setPrimaryColor,
    }),
    [isDark, primaryColor]
  );

  return (
    <ThemeCtx.Provider value={ctxValue}>
      <ConfigProvider theme={antdConfig}>{children}</ConfigProvider>
    </ThemeCtx.Provider>
  );
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useAppTheme must be used within AppThemeProvider");
  return ctx;
};
