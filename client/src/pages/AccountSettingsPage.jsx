import { Disc3, Gamepad2, ShieldCheck } from "lucide-react";
import { api, apiUrl } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

export default function AccountSettingsPage() {
  const { data, loading } = useApi(() => api.get("/api/player/dashboard"), [], {
    user: {},
    providers: {}
  });

  if (loading) return <Card><div className="h-72 rounded skeleton" /></Card>;

  const user = data?.user || {};
  const providers = data?.providers || {};

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Account settings</p>
        <h1 className="mt-2 text-3xl font-black">Connections</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
          Connect Discord and Steam one time. After they are connected, the website remembers them on your account and you do not need to connect them again every login.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <ConnectionCard
          title="Discord"
          icon={Disc3}
          connected={Boolean(providers.discord || user.discord_id)}
          value={user.discord_id || user.discord_username || "Discord is not linked."}
          href={apiUrl("/api/auth/discord?mode=link")}
        />
        <ConnectionCard
          title="Steam"
          icon={Gamepad2}
          connected={Boolean(providers.steam || user.steam_id)}
          value={user.steam_id || user.steam_persona || "Steam is not linked."}
          href={apiUrl("/api/auth/steam?mode=link")}
        />
      </div>
    </div>
  );
}

function ConnectionCard({ title, icon: Icon, connected, value, href }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black"><Icon size={20} /> {title}</h2>
          <p className="mt-2 break-all text-sm text-white/55">{value}</p>
        </div>
        {connected && <ShieldCheck className="text-a2-success" />}
      </div>

      {connected ? (
        <div className="mt-4 rounded-lg border border-a2-success/35 bg-a2-success/10 p-3 text-sm text-white/70">
          Connected. No reconnect is needed when you log in again.
        </div>
      ) : (
        <Button as="a" href={href} className="mt-4" variant="ghost">Link {title}</Button>
      )}
    </Card>
  );
}
