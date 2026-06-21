import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      home: "Home",
      roster: "Roster",
      live: "Live",
      team: "Team",
      careers: "Careers",
      tickets: "Tickets",
      news: "News",
      map: "Map",
      faq: "FAQ",
      terms: "Terms",
      events: "Events",
      journey: "Journey",
      famous: "Famous Characters",
      login: "Login",
      logout: "Logout",
      account: "Account",
      admin: "Admin",
      search: "Search",
      offline: "Offline",
      unknown: "Unknown"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("a2_language") || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
