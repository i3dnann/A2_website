import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      home: "Home",
      news: "News",
      events: "Events",
      businesses: "Businesses",
      map: "Map",
      jobs: "Jobs",
      characters: "Characters",
      streamers: "Streamers",
      status: "Status",
      rules: "Rules",
      login: "Login",
      logout: "Logout",
      dashboard: "Dashboard",
      search: "Search",
      live: "LIVE",
      offline: "Offline",
      unknown: "Unknown"
    }
  },
  ar: {
    translation: {
      home: "الرئيسية",
      news: "الأخبار",
      events: "الفعاليات",
      businesses: "الأعمال",
      map: "الخريطة",
      jobs: "الوظائف",
      characters: "الشخصيات",
      streamers: "المبدعون",
      status: "الحالة",
      rules: "القوانين",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      dashboard: "لوحة التحكم",
      search: "بحث",
      live: "مباشر",
      offline: "غير متصل",
      unknown: "غير معروف"
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
