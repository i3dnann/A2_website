import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext.jsx";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { setLanguage } = useApp();

  return (
    <label className="flex items-center gap-2 rounded-lg border border-a2-border bg-white/5 px-3 py-2 text-sm text-white/70">
      <Languages size={16} />
      <select className="bg-transparent text-white outline-none" value={i18n.language} onChange={(event) => setLanguage(event.target.value)}>
        <option className="bg-black" value="en">English</option>
        <option className="bg-black" value="ar">العربية</option>
      </select>
    </label>
  );
}
