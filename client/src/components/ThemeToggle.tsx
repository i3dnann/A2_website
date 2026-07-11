import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return <button type="button" onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`} title={`${dark ? "Light" : "Dark"} mode`} className="theme-toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/80 backdrop-blur-xl transition hover:border-orange-300/40 hover:text-orange-200">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>;
}
