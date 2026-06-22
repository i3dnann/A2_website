import { NavLink, Outlet } from "react-router-dom";
import { Home, LogOut } from "lucide-react";
import { accountNav, adminNav } from "../data/navigation.js";
import { useApp } from "../context/AppContext.jsx";
import { api } from "../lib/api.js";

export function DashboardLayout() {
  const { settings, user, hasPermission, setUser } = useApp();
  const accountItems = accountNav.filter((item) => hasPermission(item.permission));
  const adminItems = adminNav.filter((item) => hasPermission(item.permission));

  const logout = async () => {
    await api.post("/api/auth/logout", {}).catch(() => {});
    localStorage.removeItem("a2_session_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <div className="a2-shell min-h-screen bg-black">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-a2-border bg-black/88 p-4 backdrop-blur-xl lg:flex">
        <NavLink to="/" className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-a2-green/40 bg-a2-green/10 font-black text-a2-green">
            {settings.logoUrl ? <img src={settings.logoUrl} className="h-full w-full rounded-full object-cover" alt={settings.websiteName || "A2 Studio"} /> : "A2"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-black">{settings.websiteName || "A2 Studio"}</p>
            <p className="truncate text-xs text-white/45">{user?.username || "Dashboard"}</p>
          </div>
        </NavLink>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <DashboardNav title="Account" items={accountItems} />
          {adminItems.length > 0 && <DashboardNav title="Admin" items={adminItems} />}
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-a2-border bg-black/74 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex flex-1 items-center gap-2 overflow-x-auto lg:hidden">
              {[...accountItems, ...adminItems].slice(0, 8).map((item) => (
                <NavLink key={item.href} to={item.href} className="whitespace-nowrap rounded-lg border border-a2-border px-3 py-2 text-xs text-white/65">
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden text-right md:block">
                <p className="text-sm font-bold">{user?.username || "Guest"}</p>
                <p className="text-xs text-white/45">{user?.roles?.join(", ") || "Player"}</p>
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

function DashboardNav({ title, items }) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-2 text-xs font-black uppercase tracking-widest text-white/35">{title}</p>
      <nav className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.href} to={item.href} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-a2-green text-black" : "text-white/64 hover:bg-white/7 hover:text-white"}`}>
              <Icon size={17} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
