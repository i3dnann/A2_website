import { Globe2, LayoutDashboard, Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSite } from "../context/SiteContext";
import { ShimmerButton } from "./ui/shimmer-button";

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
  const { t, language, toggleLanguage } = useLanguage();
  const location = useLocation();
  const stickyBannerActive = Boolean(content.stickyBannerEnabled && content.stickyBannerText);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const openDiscord = () => {
    const target = content.discordLink && content.discordLink !== "#" ? content.discordLink : "/";
    if (target.startsWith("http")) window.open(target, "_blank", "noopener,noreferrer");
    else window.location.assign(target);
  };

  return (
    <header
      style={{ top: stickyBannerActive ? 40 : 0 }}
      className="navbar-enter fixed inset-x-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
    >
      <div className="mx-auto max-w-[90rem]">
        <div
          className={`relative flex items-center justify-between rounded-2xl border px-3 backdrop-blur-2xl transition-all duration-500 sm:px-4 ${
            scrolled
              ? "h-16 border-white/12 bg-[#080910]/88 shadow-[0_18px_60px_rgba(0,0,0,.42)]"
              : "h-[4.5rem] border-white/[.09] bg-[#080910]/54 shadow-[0_16px_48px_rgba(0,0,0,.2)]"
          }`}
        >
          <Link to="/" className="flex shrink-0 items-center gap-3 rounded-xl pr-2">
            <img
              src={content.logoUrl === "/assets/gotham-logo.png" ? "/assets/gotham-logo-96.webp" : content.logoUrl || "/images/gotham-emblem-static.jpg"}
              alt={content.siteName}
              className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/15"
            />
            <span className="hidden leading-tight sm:grid">
              <strong className="text-sm font-semibold tracking-tight text-white sm:text-base">{t(content.siteName)}</strong>
              <small className="mt-0.5 text-[10px] text-violet-200/55">Roleplay network</small>
            </span>
          </Link>

          <nav className="hidden items-center rounded-xl border border-white/[.06] bg-white/[.025] p-1 xl:flex">
            {NAV_ROUTES.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${active ? "text-white" : "text-white/48 hover:text-white/90"}`}
                >
                  {active && (
                    <span className="absolute inset-0 -z-10 rounded-lg border border-white/[.08] bg-white/[.07] shadow-[0_8px_24px_rgba(0,0,0,.2)]" />
                  )}
                  {t(link.label)}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            {isAdmin && (
              <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-xs font-medium text-violet-100 transition hover:bg-violet-400/15">
                <ShieldCheck size={14} /> {t("Admin")}
              </Link>
            )}
            {user ? (
              <Link to="/dashboard" className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-sm font-medium text-white/78 transition hover:bg-white/[.07] hover:text-white">
                <LayoutDashboard size={15} /> {t("Dashboard")}
              </Link>
            ) : (
              <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/[.05] hover:text-white">
                {t("Login")}
              </Link>
            )}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.035] text-white/62 transition hover:bg-white/[.07] hover:text-white"
              aria-label={language === "ar" ? "Switch to English" : "Switch to Arabic"}
              title={language === "ar" ? "English" : "Arabic"}
            >
              <Globe2 size={17} />
            </button>
            <ShimmerButton
              type="button"
              onClick={openDiscord}
              borderRadius="12px"
              background="linear-gradient(135deg, var(--site-primary), var(--site-accent))"
              shimmerDuration="2.8s"
              className="px-4 py-2.5 text-sm font-semibold"
            >
              {t("Join Discord")}
            </ShimmerButton>
          </div>

          <div className="ml-auto flex items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.035] text-white/70"
              aria-label={language === "ar" ? "Switch to English" : "Switch to Arabic"}
            >
              <Globe2 size={18} />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[.035] text-white"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
            >
              {open ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {open && (
            <div className="mobile-menu-in mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#090a11]/95 p-3 shadow-[0_24px_80px_rgba(0,0,0,.55)] backdrop-blur-2xl xl:hidden">
              <div className="grid gap-1 sm:grid-cols-2">
                {NAV_ROUTES.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition ${location.pathname === link.path ? "bg-violet-400/12 text-violet-100" : "text-white/65 hover:bg-white/[.05] hover:text-white"}`}
                  >
                    {t(link.label)}
                  </Link>
                ))}
              </div>
              <div className="mt-2 grid gap-2 border-t border-white/[.08] pt-3 sm:grid-cols-2">
                {isAdmin && <Link to="/admin" className="rounded-xl border border-violet-300/20 px-4 py-3 text-center text-sm text-violet-100">{t("Admin Panel")}</Link>}
                <Link to={user ? "/dashboard" : "/login"} className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-white/85">{t(user ? "Dashboard" : "Login")}</Link>
                <button type="button" onClick={openDiscord} className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white sm:col-span-2">{t("Join Discord")}</button>
              </div>
            </div>
        )}
      </div>
    </header>
  );
}
