import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher({ compact = false }) {
  const { i18n } = useTranslation();
  const current = i18n.language === "ar" ? "ar" : "en";
  const change = async (language) => {
    localStorage.setItem("a2_language", language);
    document.cookie = `a2_language=${language}; path=/; max-age=31536000; SameSite=Lax`;
    await i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    window.dispatchEvent(new CustomEvent("a2-language-change", { detail: { language } }));
  };
  return (
    <div className="flex items-center gap-1 rounded-lg border border-a2-border bg-white/[0.04] p-1" title="Language / اللغة">
      {!compact && <Languages size={15} className="mx-1 text-a2-green" />}
      <button type="button" onClick={() => change("en")} className={`rounded-md px-2 py-1 text-xs font-black ${current === "en" ? "bg-a2-green text-black" : "text-white/60 hover:text-white"}`}>EN</button>
      <button type="button" onClick={() => change("ar")} className={`rounded-md px-2 py-1 text-xs font-black ${current === "ar" ? "bg-a2-green text-black" : "text-white/60 hover:text-white"}`}>AR</button>
    </div>
  );
}
