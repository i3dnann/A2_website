import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("a2_theme");
    return saved === "dark" || saved === "light" ? saved : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; localStorage.setItem("a2_theme", theme); }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((v) => v === "dark" ? "light" : "dark") }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error("useTheme must be used within ThemeProvider"); return value; }
