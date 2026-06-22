import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

const PURPLE = "#8b5cf6";

const defaultSettings = {
  websiteName: "Gotham City",
  logoUrl: "/assets/gotham-logo.png",
  faviconUrl: "/assets/gotham-logo.png",
  primaryColor: PURPLE,
  backgroundColor: "#000000",
  textColor: "#ffffff",
  secondaryColor: "#111111",
  cardBackground: "#141414",
  borderColor: "#242424",
  mutedTextColor: "#b8b8b8",
  dangerColor: "#ff3333",
  warningColor: "#ffaa00",
  successColor: PURPLE,
  heroTitle: "Gotham City",
  heroSubtitle: "Gotham City FiveM server",
  heroDescription: "FiveM Roleplay Server",
  heroBackgroundImage: "/assets/gotham-banner.gif",
  mapImageUrl: "/assets/fivem-map.svg",
  livePageEnabled: true,
  maintenanceMode: false,
  maintenanceTitle: "The city is being rebuilt in the shadows",
  maintenanceSubtitle: "Gotham City will return soon.",
  maintenanceEndsAt: "",
  maintenanceCountdownEnabled: true,
  maintenanceYoutubeUrl: "",
  maintenanceSoundUrl: "",
  maintenanceVolume: 35,
  maintenanceFont: "Orbitron",
  performanceMode: false
};

const textReplacements = [
  ["A serious, story-driven QBCore roleplay community with creator rosters, live streams, events, support, careers, and player account tools.", "FiveM Roleplay Server"],
  ["A serious, story-driven FiveM server with city news, creator roster, live streams, events, support, careers, and player account tools.", "FiveM Roleplay Server"],
  ["A2 Studio Roleplay", "Gotham City"],
  ["A2 Studio", "Gotham City"],
  ["Premium FiveM community", "Gotham City FiveM server"],
  ["premium FiveM community", "Gotham City FiveM server"],
  ["QBCore roleplay community", "FiveM roleplay server"],
  ["QBCore roleplay", "FiveM roleplay"]
];

const colorReplacements = new Map([
  ["#b7fe1a", PURPLE],
  ["#35ff6b", PURPLE],
  ["#38bdf8", PURPLE],
  ["#ef4444", PURPLE]
]);

function normalizeSettingValue(value) {
  if (typeof value !== "string") return value;
  const color = value.trim().toLowerCase();
  if (colorReplacements.has(color)) return colorReplacements.get(color);
  return textReplacements.reduce((current, [from, to]) => current.replaceAll(from, to), value);
}

function normalizeSettings(settings = {}) {
  return Object.fromEntries(Object.entries(settings || {}).map(([key, value]) => [key, normalizeSettingValue(value)]));
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [settings, setSettingsState] = useState(defaultSettings);
  const [user, setUser] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(true);

  const setSettings = (updater) => {
    setSettingsState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return normalizeSettings({ ...current, ...(next || {}) });
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("gotham_session_token", token);
      localStorage.removeItem("a2_session_token");
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
      providers: asList(providers),
      loading,
      apiHealthy
    }),
    [settings, user, providers, loading, apiHealthy]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
