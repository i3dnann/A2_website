import { Link } from "react-router-dom";
import { Globe, MessageCircle, Radio } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";

const FOOTER_LINKS = [
  { path: "/", label: "Home" },
  { path: "/server", label: "Server" },
  { path: "/roster", label: "Roster" },
  { path: "/live", label: "Live" },
  { path: "/journey", label: "Journey" },
  { path: "/news", label: "News" },
  { path: "/careers", label: "Careers" },
  { path: "/faq", label: "FAQ" },
];

const SOCIAL_LINKS = [
  { icon: Radio, label: "Live page", path: "/live" },
  { icon: MessageCircle, label: "Discord", path: "" },
  { icon: Globe, label: "Website", path: "/" },
];

export default function Footer() {
  const { content } = useSite();
  const { t } = useLanguage();
  return (
    <footer className="relative border-t border-white/10 pb-10 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/images/gotham-emblem-static.jpg" alt={content.siteName} loading="lazy" className="h-9 w-9 rounded-full object-cover ring-1 ring-orange-400/25" />
              <span className="font-serif text-lg tracking-[0.2em] text-white">{t(content.siteName)}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/50">{t("An immersive CFW Roleplay community built for deep stories, serious roleplay, and a cinematic city experience.")}</p>
            <div className="mt-5 flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, label, path }) => {
                const href = label === "Discord" ? content.discordLink || "/login" : path;
                const external = /^https?:\/\//i.test(href);
                return (
                  <a key={label} aria-label={t(label)} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:border-orange-400/40 hover:text-orange-300"><Icon size={16} /></a>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/40">{t("Navigate")}</div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {FOOTER_LINKS.map((l) => (
                <li key={l.path}><Link to={l.path} className="text-sm text-white/60 transition hover:text-white">{t(l.label)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/40">{t("Resources")}</div>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
              <li><Link to="/faq" className="transition hover:text-white">{t("Rules")}</Link></li>
              <li><Link to="/dashboard" className="transition hover:text-white">{t("Tickets")}</Link></li>
              <li><Link to="/terms" className="transition hover:text-white">{t("Terms of Service")}</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/40">{t("Stay Updated")}</div>
            <p className="mt-4 text-sm text-white/50">{t("Get the latest news and event announcements from Gotham City.")}</p>
            <form className="mt-4 flex overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <input type="email" placeholder="you@email.com" className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none" />
              <button type="submit" className="whitespace-nowrap bg-gradient-to-r from-orange-600 to-orange-400 px-4 text-sm font-semibold text-white">{t("Join")}</button>
            </form>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {t(content.siteName)}. Not affiliated with Rockstar Games or WB Entertainment.</p>
          <p>{t("Created with Love by A2 Studio")}</p>
        </div>
      </div>
    </footer>
  );
}
