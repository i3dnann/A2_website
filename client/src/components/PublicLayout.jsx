import { Link, NavLink, Outlet } from "react-router-dom";
import { LogIn, Menu } from "lucide-react";
import { useState } from "react";
import { publicNav } from "../data/navigation.js";
import { useApp } from "../context/AppContext.jsx";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";
import { Button } from "./Button.jsx";

export function PublicLayout() {
  const { settings, user } = useApp();
  const [open, setOpen] = useState(false);
  const visibleNav = publicNav;

  return (
    <div className="a2-shell min-h-screen">
      <header className="sticky top-0 z-40 border-b border-a2-border bg-black/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-a2-green/40 bg-a2-green/10 font-black text-a2-green">
              {settings.logoUrl ? <img src={settings.logoUrl} className="h-full w-full rounded-lg object-cover" alt="" /> : "A2"}
            </div>
            <div>
              <p className="text-base font-black">{settings.websiteName || "A2 Studio"}</p>
              <p className="text-xs text-white/45">City control platform</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {visibleNav.map((item) => (
              <NavLink key={item.href} to={item.href} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-a2-green text-black" : "text-white/68 hover:bg-white/7 hover:text-white"}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <Button as={Link} to={user ? "/player/dashboard" : "/login"} variant={user ? "ghost" : "primary"}>
              <LogIn size={16} />
              {user ? "Portal" : "Login"}
            </Button>
          </div>
          <button className="rounded-lg border border-a2-border p-2 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
        {open && (
          <div className="border-t border-a2-border px-4 py-3 lg:hidden">
            <nav className="grid gap-1">
              {visibleNav.map((item) => (
                <NavLink key={item.href} to={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/7">
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>
      <Outlet />
      <footer className="border-t border-a2-border bg-black/70">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-black">{settings.websiteName || "A2 Studio"}</p>
            <p className="mt-2 max-w-2xl text-sm text-white/48">{settings.homepageDescription}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-white/55">
            <Link to="/terms" className="hover:text-a2-green">Terms</Link>
            <span>/</span>
            <Link to="/rules" className="hover:text-a2-green">Rules</Link>
            <span>/</span>
            <Link to="/status" className="hover:text-a2-green">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
