import { useEffect, useState } from "react";
import { RefreshCw, Save, Send } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

const webhookRows = [
  ["WEBHOOK_USER_ACCOUNTS", "User accounts", "Login, logout, register, account actions"],
  ["WEBHOOK_SECURITY", "Security", "Bans, blocked login attempts, security actions"],
  ["WEBHOOK_ADMIN_LOGS", "Admin logs", "Admin panel actions"],
  ["WEBHOOK_TICKETS_OPEN", "Tickets opened", "New player ticket embeds"],
  ["WEBHOOK_TICKETS_CLOSED", "Tickets closed", "Closed ticket summary embeds"],
  ["WEBHOOK_CAREERS", "Careers", "Applications and career updates"],
  ["WEBHOOK_STREAMERS", "Streamers", "Streamer live/status updates"]
];

export default function AdminWebhooksPage() {
  const [draft, setDraft] = useState({});
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { data, loading } = useApi(() => api.get("/api/admin/webhooks"), [refresh], { webhooks: {} });

  useEffect(() => {
    const next = {};
    webhookRows.forEach(([key]) => { next[key] = ""; });
    setDraft(next);
  }, [data]);

  const save = async (event) => {
    event.preventDefault();
    const patch = Object.fromEntries(Object.entries(draft).filter(([, value]) => String(value || "").trim()));
    if (!Object.keys(patch).length) return setNotice("Paste at least one Discord webhook URL before saving.");
    await api.patch("/api/admin/webhooks", patch);
    setNotice("Webhook settings saved. Existing configured URLs stay hidden for security.");
    setDraft(Object.fromEntries(webhookRows.map(([key]) => [key, ""])));
    setRefresh((value) => value + 1);
  };

  const configured = data?.webhooks || {};

  return <div className="grid gap-5"><header><p className="text-sm font-black uppercase tracking-widest text-a2-green">Webhooks</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Discord webhook setup</h1><p className="mt-2 text-sm text-white/55">Paste Discord webhook URLs here. URLs are hidden after saving. User login/logout embeds use the User accounts webhook.</p></header>{notice && <p className="rounded-lg border border-a2-green/35 bg-a2-green/10 p-3 text-sm text-a2-green">{notice}</p>}<Card><form className="grid gap-4" onSubmit={save}>{webhookRows.map(([key, title, description]) => <div key={key} className="rounded-xl border border-a2-border bg-white/[0.035] p-4"><div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black">{title}</h2><p className="text-sm text-white/50">{description}</p><p className="mt-1 text-xs text-white/35">{key}</p></div><span className={`rounded-full border px-2 py-1 text-xs font-black ${configured[key]?.configured ? "border-a2-green/50 text-a2-green" : "border-a2-warning/50 text-a2-warning"}`}>{configured[key]?.configured ? "Configured" : "Missing"}</span></div><input className="form-input" type="password" placeholder={configured[key]?.configured ? "Configured - paste new URL only if you want to replace it" : "Paste Discord webhook URL"} value={draft[key] || ""} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} /></div>)}<div className="flex flex-wrap gap-2"><Button type="submit"><Save size={15} /> Save webhook URLs</Button><Button type="button" variant="ghost" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} /> Reload</Button></div>{loading && <p className="text-sm text-white/45">Loading webhook settings...</p>}</form></Card><Card><h2 className="text-xl font-black">Login / Logout embed format</h2><p className="mt-2 text-sm leading-6 text-white/55">When a user logs in or logs out, Discord receives a clean embed with username, account ID, email, Discord ID, Steam ID, IP address, method, and status.</p><p className="mt-3 flex items-center gap-2 text-sm text-a2-green"><Send size={15} /> Configure WEBHOOK_USER_ACCOUNTS for these embeds.</p></Card></div>;
}
