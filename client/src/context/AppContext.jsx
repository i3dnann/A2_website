import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

const defaultSettings = {
  websiteName: "A2 Studio",
  logoUrl: "/assets/gotham-logo.png",
  faviconUrl: "/assets/gotham-logo.png",
  primaryColor: "#8b5cf6",
  backgroundColor: "#000000",
  textColor: "#ffffff",
  secondaryColor: "#111111",
  cardBackground: "#141414",
  borderColor: "#242424",
  mutedTextColor: "#b8b8b8",
  dangerColor: "#ff3333",
  warningColor: "#ffaa00",
  successColor: "#35ff6b",
  heroTitle: "A2 Studio Roleplay",
  heroSubtitle: "Premium FiveM community",
  heroDescription: "A serious, story-driven QBCore roleplay community.",
  heroBackgroundImage: "/assets/gotham-banner.gif",
  mapImageUrl: "/assets/fivem-map.svg",
  livePageEnabled: true,
  maintenanceMode: false,
  performanceMode: false
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [user, setUser] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("a2_session_token", token);
      window.history.replaceState(null, "", window.location.pathname);
    }

    let mounted = true;
    Promise.allSettled([api.get("/api/public/settings"), api.get("/api/auth/me")]).then(([settingsResult, userResult]) => {
      if (!mounted) return;
      if (settingsResult.status === "fulfilled") setSettings((current) => ({ ...current, ...(settingsResult.value.settings || {}) }));
      if (userResult.status === "fulfilled") {
        setUser(userResult.value.user || null);
        setProviders(userResult.value.providers || []);
      }
      if (settingsResult.status === "rejected" || userResult.status === "rejected") setApiHealthy(false);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", settings.primaryColor || defaultSettings.primaryColor);
    root.style.setProperty("--color-bg", settings.backgroundColor || defaultSettings.backgroundColor);
    root.style.setProperty("--color-text", settings.textColor || defaultSettings.textColor);
    root.style.setProperty("--color-panel", settings.secondaryColor || defaultSettings.secondaryColor);
    root.style.setProperty("--color-card", settings.cardBackground || defaultSettings.cardBackground);
    root.style.setProperty("--color-border", settings.borderColor || defaultSettings.borderColor);
    root.style.setProperty("--color-muted", settings.mutedTextColor || defaultSettings.mutedTextColor);
    root.style.setProperty("--color-danger", settings.dangerColor || defaultSettings.dangerColor);
    root.style.setProperty("--color-warning", settings.warningColor || defaultSettings.warningColor);
    root.style.setProperty("--color-success", settings.successColor || defaultSettings.successColor);
    document.title = settings.websiteName || defaultSettings.websiteName;
    let icon = document.querySelector("link[rel='icon']");
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = settings.faviconUrl || settings.logoUrl || defaultSettings.faviconUrl;
    document.body.classList.toggle("performance-mode", Boolean(settings.performanceMode));
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      user,
      setUser,
      providers,
      setProviders,
      loading,
      apiHealthy,
      hasPermission(permission) {
        const permissions = user?.permissions || [];
        return permissions.includes("master_access") || permissions.includes(permission);
      }
    }),
    [settings, user, providers, loading, apiHealthy]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
