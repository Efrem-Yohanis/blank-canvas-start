import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type FontSize = "sm" | "base" | "lg" | "xl";
export type FontFamily = "serif" | "sans" | "mono" | "inter" | "merriweather";
export type Theme = "light" | "dark" | "system";

type SettingsCtx = {
  fontSize: FontSize;
  fontFamily: FontFamily;
  theme: Theme;
  setFontSize: (s: FontSize) => void;
  setFontFamily: (f: FontFamily) => void;
  setTheme: (t: Theme) => void;
};

const Ctx = createContext<SettingsCtx | null>(null);

const FONT_SCALE: Record<FontSize, string> = {
  sm: "0.9",
  base: "1",
  lg: "1.15",
  xl: "1.3",
};

const FONT_STACK: Record<FontFamily, string> = {
  serif: '"Source Serif Pro", Georgia, serif',
  sans: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  inter: 'Inter, system-ui, sans-serif',
  merriweather: 'Merriweather, Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = t === "dark" || (t === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("base");
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("serif");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    try {
      const fs = localStorage.getItem("settings.fontSize") as FontSize | null;
      const ff = localStorage.getItem("settings.fontFamily") as FontFamily | null;
      const th = localStorage.getItem("settings.theme") as Theme | null;
      if (fs) setFontSizeState(fs);
      if (ff) setFontFamilyState(ff);
      if (th) setThemeState(th);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-font-scale", FONT_SCALE[fontSize]);
    try { localStorage.setItem("settings.fontSize", fontSize); } catch {}
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.style.setProperty("--app-font-family", FONT_STACK[fontFamily]);
    try { localStorage.setItem("settings.fontFamily", fontFamily); } catch {}
  }, [fontFamily]);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem("settings.theme", theme); } catch {}
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  return (
    <Ctx.Provider
      value={{
        fontSize,
        fontFamily,
        theme,
        setFontSize: setFontSizeState,
        setFontFamily: setFontFamilyState,
        setTheme: setThemeState,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
