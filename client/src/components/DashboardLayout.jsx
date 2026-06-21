import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, Home, LogOut, Search } from "lucide-react";
import { allDashboardNav } from "../data/navigation.js";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../lib/api.js";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";

export function DashboardLayout() {
  const { settings, user, hasPermission, setUser } = useApp();
  const location = useLocation();
  const nav = allDashboardNav.filter((item) => hasPermission(item.permission));

  const logout = async () => {
    await api.post("/api/auth/logout", {}).catch(() => {});
    localStorage.removeItem("a2_session_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <div className="a2-shell min-h-screen bg-black">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-a2-border bg-black/86 p-4 backdrop-blur-xl lg:block">
        <NavLink to="/" className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg border border-a2-green/40 bg-a2-green/10 font-black text-a2-green">A2</div>
          <div>
            <p className="font-black">{settings.websiteName || "A2 Studio"}</p>
            <p className="text-xs text-white/45">Roleplay platform</p>
          </div>
        </NavLink>
        <nav className="grid gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.href} to={item.href} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isActive || location.pathname === item.href ? "bg-a2-green text-black" : "text-white/64 hover:bg-white/7 hover:text-white"}`}>
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-a2-border bg-black/72 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="hidden w-full max-w-sm items-center gap-2 rounded-lg border border-a2-border bg-white/5 px-3 py-2 text-white/48 md:flex">
              <Search size={16} />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Global search..." />
            </div>
            <div className="flex flex-1 items-center gap-2 overflow-x-auto lg:hidden">
              {nav.slice(0, 6).map((item) => (
                <NavLink key={item.href} to={item.href} className="whitespace-nowrap rounded-lg border border-a2-border px-3 py-2 text-xs text-white/65">
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher />
              <button className="rounded-lg border border-a2-border p-2 text-white/65" aria-label="Notifications">
                <Bell size={17} />
              </button>
              <div className="hidden text-right md:block">
                <p className="text-sm font-bold">{user?.username || "Guest"}</p>
                <p className="text-xs text-white/45">{user?.roles?.join(", ") || "No role"}</p>
              </div>
              <button className="rounded-lg border border-a2-border p-2 text-white/65 hover:border-a2-danger hover:text-a2-danger" onClick={logout} aria-label="Logout">
                <LogOut size={17} />
              </button>
              <NavLink to="/" className="rounded-lg border border-a2-border p-2 text-white/65" aria-label="Public site">
                <Home size={17} />
              </NavLink>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
