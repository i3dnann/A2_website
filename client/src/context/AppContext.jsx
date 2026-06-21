import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api.js";

const defaultSettings = {
  websiteName: "A2 Studio",
  primaryColor: "#b7fe1a",
  backgroundColor: "#000000",
  textColor: "#ffffff",
  secondaryDark: "#111111",
  borderColor: "#242424",
  dangerColor: "#ff3333",
  warningColor: "#ffaa00",
  successColor: "#35ff6b",
  homepageDescription: "A premium FiveM QBCore roleplay city platform.",
  discordInviteUrl: "#",
  fivemConnectUrl: "#",
  streamerPageEnabled: true
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { i18n } = useTranslation();
  const [settings, setSettings] = useState(defaultSettings);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(true);

  useEffect(() => {
    if (window.location.hash.includes("a2_session=")) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const token = params.get("a2_session");
      if (token) {
        localStorage.setItem("a2_session_token", token);
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }
    }

    let mounted = true;
    Promise.allSettled([api.get("/api/public/settings"), api.get("/api/auth/me")]).then(([settingsResult, userResult]) => {
      if (!mounted) return;
      if (settingsResult.status === "fulfilled") setSettings((current) => ({ ...current, ...(settingsResult.value.settings || {}) }));
      if (userResult.status === "fulfilled") setUser(userResult.value.user || null);
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
    root.style.setProperty("--color-panel", settings.secondaryDark || defaultSettings.secondaryDark);
    root.style.setProperty("--color-border", settings.borderColor || defaultSettings.borderColor);
    root.style.setProperty("--color-danger", settings.dangerColor || defaultSettings.dangerColor);
    root.style.setProperty("--color-warning", settings.warningColor || defaultSettings.warningColor);
    root.style.setProperty("--color-success", settings.successColor || defaultSettings.successColor);
    document.title = settings.websiteName || defaultSettings.websiteName;
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [settings, i18n.language]);

  const setLanguage = async (language) => {
    const safeLanguage = language === "ar" ? "ar" : "en";
    localStorage.setItem("a2_language", safeLanguage);
    await i18n.changeLanguage(safeLanguage);
    api.post("/api/auth/language", { language: safeLanguage }).catch(() => {});
  };

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      user,
      setUser,
      loading,
      apiHealthy,
      setLanguage,
      hasPermission(permission) {
        const permissions = user?.permissions || [];
        return permissions.includes("master_access") || permissions.includes(permission);
      }
    }),
    [settings, user, loading, apiHealthy]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
