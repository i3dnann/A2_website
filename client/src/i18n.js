import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { translation: { language: "Language", english: "English", arabic: "Arabic", home: "Home", roster: "Roster", live: "Live", gallery: "Gallery", team: "Team", careers: "Careers", tickets: "Tickets", news: "News", map: "Map", faq: "FAQ", terms: "Terms", events: "Events", journey: "Journey", famous: "Famous Characters", login: "Login", logout: "Logout", account: "Account", admin: "Admin", search: "Search", offline: "Offline", unknown: "Unknown" } },
  ar: { translation: { language: "Language", english: "English", arabic: "Arabic", home: "Home", roster: "Roster", live: "Live", gallery: "Gallery", team: "Team", careers: "Careers", tickets: "Tickets", news: "News", map: "Map", faq: "FAQ", terms: "Terms", events: "Events", journey: "Journey", famous: "Famous Characters", login: "Login", logout: "Logout", account: "Account", admin: "Admin", search: "Search", offline: "Offline", unknown: "Unknown" } }
};

const savedLanguage = localStorage.getItem("a2_language") || document.cookie.match(/(?:^|; )a2_language=([^;]+)/)?.[1] || "en";
document.documentElement.lang = savedLanguage === "ar" ? "ar" : "en";
document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";

i18n.use(initReactI18next).init({ resources, lng: savedLanguage === "ar" ? "ar" : "en", fallbackLng: "en", interpolation: { escapeValue: false } });

export default i18n;
