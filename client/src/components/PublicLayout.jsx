import { Link, NavLink, Outlet } from "react-router-dom";
import { LogIn, Menu, UserCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { publicNav } from "../data/navigation.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "./Button.jsx";

export function PublicLayout() {
  const { settings, user } = useApp();
  const [open, setOpen] = useState(false);
  const nav = useMemo(() => {
    const editable = Array.isArray(settings.navLinks) ? settings.navLinks : [];
    const base = editable.length ? editable.map((item) => ({ label: item.label, href: item.url || item.href || "/" })) : publicNav;
    return base.some((item) => item.href === "/famous") ? base : [...base, { label: "Famous", href: "/famous" }];
  }, [settings.navLinks]);

  return (
    <div className="a2-shell min-h-screen">
      <header className="sticky top-0 z-40 border-b border-a2-border bg-black/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-a2-green/40 bg-a2-green/10 font-black text-a2-green">
              {settings.logoUrl ? <img src={settings.logoUrl} className="h-full w-full rounded-full object-cover" alt={settings.websiteName || "A2 Studio"} /> : "A2"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black">{settings.websiteName || "A2 Studio"}</p>
              <p className="truncate text-xs text-white/45">{settings.heroSubtitle || "Premium FiveM community"}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <NavLink key={`${item.href}-${item.label}`} to={item.href} className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-a2-green text-black" : "text-white/68 hover:bg-white/7 hover:text-white"}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button as={Link} to={user ? "/account" : "/login"} variant={user ? "ghost" : "primary"}>
              {user ? <UserCircle size={16} /> : <LogIn size={16} />}
              {user ? "Account" : "Login"}
            </Button>
            {user?.permissions?.some((permission) => permission !== "view_player_portal") && (
              <Button as={Link} to="/admin" variant="ghost">Admin</Button>
            )}
          </div>

          <button className="rounded-lg border border-a2-border p-2 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>

        {open && (
          <div className="border-t border-a2-border px-4 py-3 lg:hidden">
            <nav className="grid gap-1">
              {nav.map((item) => (
                <NavLink key={`${item.href}-${item.label}`} to={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/7">
                  {item.label}
                </NavLink>
              ))}
              <NavLink to={user ? "/account" : "/login"} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-a2-green">
                {user ? "Account" : "Login / Register"}
              </NavLink>
            </nav>
          </div>
        )}
      </header>

      <Outlet />

      <footer className="border-t border-a2-border bg-black/76">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-9 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-black">{settings.websiteName || "A2 Studio"}</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">FiveM Roleplay Server</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-white/55">
            <Link to="/terms" className="hover:text-a2-green">Terms</Link>
            <span>/</span>
            <Link to="/tickets" className="hover:text-a2-green">Support</Link>
            <span>/</span>
            <Link to="/careers" className="hover:text-a2-green">Careers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
