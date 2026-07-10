import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LayoutDashboard, ShieldCheck, Globe2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";

const NAV_ROUTES = [
  { path: "/", label: "Home" },
  { path: "/server", label: "Server" },
  { path: "/roster", label: "Roster" },
  { path: "/live", label: "Live" },
  { path: "/journey", label: "Journey" },
  { path: "/news", label: "News" },
  { path: "/careers", label: "Careers" },
  { path: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { content } = useSite();
  const { t, language, toggleLanguage, isArabic } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all duration-500 ${
            scrolled
              ? "border-orange-500/20 bg-black/60 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
              : "border-white/5 bg-black/20"
          }`}
        >
          <Link to="/" onClick={() => setOpen(false)} className="flex shrink-0 items-center gap-3">
            <img src="/images/gotham-emblem-static.jpg" alt={content.siteName} className="h-9 w-9 rounded-full object-cover ring-1 ring-orange-400/25 sm:h-10 sm:w-10" />
            <span className="font-serif text-base tracking-[0.2em] text-white sm:text-lg">
              {t(content.siteName)}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {NAV_ROUTES.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className="relative px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
              >
                {t(link.label)}
                {location.pathname === link.path && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-2 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-orange-400 to-orange-300"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:gap-3 xl:flex">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-xs font-medium text-orange-200 transition hover:border-orange-400/50"
              >
                <ShieldCheck size={14} /> {t("Admin")}
              </Link>
            )}
            {user ? (
              <>
                <Link
                  to="/characters"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-white/85 transition hover:border-orange-400/40 hover:text-white"
                >
                  {t("Characters")}
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-white/85 transition hover:border-orange-400/40 hover:text-white"
                >
                  <LayoutDashboard size={15} />
                  {t("Dashboard")}
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-orange-400/40 hover:text-white"
              >
                {t("Login")}
              </Link>
            )}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/75 transition hover:border-[#8a7ac4]/50 hover:text-white"
              aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
              title={language === "ar" ? "English" : "العربية"}
            >
              <Globe2 size={17} />
            </button>
            <a
              href={content.discordLink || "/"}
              target={content.discordLink && content.discordLink !== "#" ? "_blank" : undefined}
              rel="noreferrer"
              className="group relative overflow-hidden rounded-xl bg-[#60519b] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(96,81,155,0.34)] transition hover:bg-[#7868b8] hover:shadow-[0_0_30px_rgba(96,81,155,0.58)]"
            >
              <span className="relative z-10 whitespace-nowrap">{t("Join Discord")}</span>
              <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
            </a>
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/75"
              aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe2 size={18} />
            </button>
            <button className="text-white" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl xl:hidden"
            >
              <div className="flex flex-col p-4">
                {NAV_ROUTES.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setOpen(false)}
                    className={`rounded-lg px-4 py-3 text-left text-sm font-medium transition ${
                      location.pathname === link.path ? "bg-orange-500/10 text-orange-300" : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {t(link.label)}
                  </Link>
                ))}
                <hr className="my-2 border-white/10" />
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 text-left text-sm font-medium text-orange-200 hover:bg-orange-500/5 flex items-center gap-2">
                    <ShieldCheck size={16} /> {t("Admin Panel")}
                  </Link>
                )}
                {user ? (
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-4 py-3 text-center text-sm font-medium text-white/85 mt-1">
                    {t("Dashboard")}
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-4 py-3 text-center text-sm font-medium text-white/85 mt-1">
                    {t("Login")}
                  </Link>
                )}
                <a href={content.discordLink || "/"} target={content.discordLink && content.discordLink !== "#" ? "_blank" : undefined} rel="noreferrer" className="mt-2 rounded-lg bg-[#60519b] px-4 py-3 text-center text-sm font-semibold text-white">
                  {t("Join Discord")}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
