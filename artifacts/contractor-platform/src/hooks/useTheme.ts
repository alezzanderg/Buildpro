import { useState, useEffect, useCallback } from "react";

type Theme = "dark" | "light";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("probuilder-theme") as Theme | null;
    if (stored === "light" || stored === "dark") return stored;
  } catch { /* noop */ }
  return "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
  try { localStorage.setItem("probuilder-theme", theme); } catch { /* noop */ }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      return next;
    });
  }, []);

  return { theme, setTheme, toggleTheme };
}
