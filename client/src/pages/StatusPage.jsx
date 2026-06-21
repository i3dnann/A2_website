import { Activity, Database, RadioTower, Server, Wifi } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Card, StatCard } from "../components/Card.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";

export default function StatusPage() {
  const { data } = useApi(() => api.get("/api/public/status"), [], { status: {} });
  const status = data?.status || {};
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <p className="text-sm font-black uppercase tracking-wide text-a2-green">Live health</p>
      <h1 className="mt-2 text-4xl font-black">Server Status</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard label="FiveM server" value={status.online ? "Online" : "Offline"} hint={status.updatedAt || "No heartbeat yet"} icon={Server} />
        <StatCard label="Players" value={`${status.players || 0}/${status.maxPlayers || 0}`} hint={`Queue: ${status.queue || 0}`} icon={Activity} />
        <StatCard label="Ping" value={status.ping || "N/A"} hint="Cached by backend" icon={Wifi} />
        <StatCard label="Website API" value={status.websiteApiStatus || "online"} hint="Express health" icon={RadioTower} />
      </div>
      <Card className="mt-6">
        <h2 className="text-2xl font-black">Technical services</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ["FiveM endpoint", status.endpointStatus],
            ["Database", status.databaseStatus],
            ["Discord bot", status.discordBotStatus],
            ["Firebase", status.firebaseStatus],
            ["Streamer checker", status.streamerCheckerStatus]
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-a2-border p-3">
              <span className="flex items-center gap-2 text-white/65"><Database size={16} /> {label}</span>
              <StatusBadge status={value || "unknown"} />
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
