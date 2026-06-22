import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Banknote, Briefcase, Gamepad2, Send, Shield, Ticket, UserCircle } from "lucide-react";
import { api, apiUrl } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Button } from "../components/Button.jsx";
import { Card, StatCard } from "../components/Card.jsx";

export default function PlayerDashboard({ section = "overview" }) {
  const { data, loading } = useApi(() => api.get("/api/player/dashboard"), [], {
    user: {},
    providers: {},
    characters: [],
    tickets: [],
    applications: [],
    banStatus: {},
    linkedIdentifiers: []
  });

  if (loading) return <Card><div className="h-80 rounded skeleton" /></Card>;
  if (section === "characters") return <CharactersView data={data} />;
  if (section === "tickets") return <TicketsView tickets={data?.tickets || []} />;
  if (section === "applications") return <ApplicationsView applications={data?.applications || []} />;
  if (section === "settings") return <SettingsView data={data} />;
  return <Overview data={data} />;
}

function Overview({ data }) {
  const user = data?.user || {};
  const providers = data?.providers || {};
  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Player account</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Welcome, {user.username || "Player"}</h1>
      </header>
      {data?.steamRequiredMessage && (
        <Card className="border-a2-warning/50 bg-a2-warning/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-a2-warning" />
            <div>
              <p className="font-black">Steam connection required</p>
              <p className="mt-1 text-sm text-white/65">{data.steamRequiredMessage}</p>
              <Button as="a" href={apiUrl("/api/auth/steam?mode=link")} className="mt-4">Connect Steam</Button>
            </div>
          </div>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Email" value={providers.email ? "Connected" : "Missing"} hint={user.email || "No email account"} icon={BadgeCheck} />
        <StatCard label="Discord" value={providers.discord ? "Connected" : "Missing"} hint={user.discord_id || "Link Discord"} icon={Shield} />
        <StatCard label="Steam" value={providers.steam ? "Connected" : "Missing"} hint={user.steam_id || "Required for characters"} icon={Gamepad2} />
        <StatCard label="Tickets" value={data?.tickets?.length || 0} hint="Your support history" icon={Ticket} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <h2 className="text-xl font-black">Ban status</h2>
          <div className="mt-4 rounded-lg border border-a2-border bg-white/[0.03] p-4">
            <p className={`text-2xl font-black ${data?.banStatus?.status === "Not banned" ? "text-a2-success" : "text-a2-danger"}`}>{data?.banStatus?.status || "Unknown"}</p>
            {data?.banStatus?.banId && (
              <dl className="mt-3 grid gap-2 text-sm text-white/60">
                <div>Ban ID: {data.banStatus.banId}</div>
                <div>Reason: {data.banStatus.reason}</div>
                <div>Expires: {data.banStatus.expiresAt || "Never"}</div>
                <div>Type: {data.banStatus.type}</div>
              </dl>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Linked FiveM identifiers</h2>
          <div className="mt-4 grid gap-2">
            {(data?.linkedIdentifiers || []).length ? data.linkedIdentifiers.map((identifier) => (
              <code key={identifier} className="rounded-lg border border-a2-border bg-black/45 px-3 py-2 text-sm text-a2-green">{identifier}</code>
            )) : <p className="text-sm text-white/50">No identifiers linked yet.</p>}
          </div>
        </Card>
      </div>
      <CharactersView data={data} compact />
      <ApplicationsView applications={data?.applications || []} compact />
    </div>
  );
}

function CharactersView({ data, compact = false }) {
  const characters = data?.characters || [];
  return (
    <div className="grid gap-5">
      {!compact && (
        <header>
          <p className="text-sm font-black uppercase tracking-widest text-a2-green">QBCore database</p>
          <h1 className="mt-2 text-3xl font-black">My characters</h1>
        </header>
      )}
      {data?.steamRequiredMessage && !compact && (
        <Card className="border-a2-warning/50 bg-a2-warning/10">
          <p className="font-black">{data.steamRequiredMessage}</p>
          <Button as="a" href={apiUrl("/api/auth/steam?mode=link")} className="mt-4">Connect Steam</Button>
        </Card>
      )}
      {data?.charactersNotFoundMessage && <Card className="text-white/65">{data.charactersNotFoundMessage}</Card>}
      <div className="grid gap-4 lg:grid-cols-2">
        {characters.map((character) => (
          <Card key={character.citizenid}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-black">{character.fullName}</p>
                <p className="text-sm text-a2-green">{character.citizenid}</p>
              </div>
              <UserCircle className="text-a2-green" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Gender/sex" value={character.gender} />
              <Info label="Phone" value={character.phone} />
              <Info label="Birthdate" value={character.birthdate} />
              <Info label="Nationality" value={character.nationality} />
              <Info label="Job" value={`${character.jobName} / ${character.jobGrade}`} icon={Briefcase} />
              <Info label="Gang" value={character.gang} />
              <Info label="Cash" value={`$${character.cash}`} icon={Banknote} />
              <Info label="Bank" value={`$${character.bank}`} icon={Banknote} />
              <Info label="Dirty money" value={`$${character.dirtyMoney}`} />
              <Info label="Last updated" value={character.lastUpdated || "Unknown"} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TicketsView({ tickets }) {
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");

  const openTicket = async (ticket) => {
    setSelected(ticket);
    setStatus("");
    const response = await api.get(`/api/player/tickets/${ticket.id}`);
    setDetail(response);
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selected?.id || !reply.trim()) return;
    await api.post(`/api/player/tickets/${selected.id}/messages`, { message: reply });
    setReply("");
    await openTicket(selected);
    setStatus("Reply sent.");
  };

  const closeTicket = async () => {
    if (!selected?.id) return;
    await api.post(`/api/player/tickets/${selected.id}/close`, {});
    await openTicket(selected);
    setStatus("Ticket closed.");
  };

  return (
    <div className="grid gap-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-a2-green">Support</p>
          <h1 className="mt-2 text-3xl font-black">My tickets</h1>
        </div>
        <Button as={Link} to="/tickets">Open ticket</Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid gap-3 content-start">
          {tickets.map((ticket) => (
          <button key={ticket.id} className="text-left" onClick={() => openTicket(ticket)}>
            <Card className={`transition ${selected?.id === ticket.id ? "border-a2-green/70" : "hover:border-a2-green/40"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-black">{ticket.subject}</p>
                <p className="text-sm text-white/50">{ticket.ticket_number || ticket.id} / {ticket.category}</p>
              </div>
              <span className="rounded-full border border-a2-border px-3 py-1 text-sm font-bold text-a2-green">{ticket.status}</span>
            </div>
            </Card>
          </button>
          ))}
          {!tickets.length && <Card className="text-white/55">No tickets yet.</Card>}
        </div>
        <Card>
          {!selected ? (
            <p className="text-sm text-white/50">Select a ticket to read and reply.</p>
          ) : (
            <div className="grid gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black">{detail?.ticket?.subject || selected.subject}</h2>
                  <p className="text-sm text-white/45">{detail?.ticket?.ticket_number || selected.ticket_number || selected.id}</p>
                </div>
                <Button type="button" variant="ghost" onClick={closeTicket}>Close ticket</Button>
              </div>
              <div className="grid max-h-[420px] gap-3 overflow-auto pr-1">
                {(detail?.messages || []).map((message) => (
                  <div key={message.id} className={`rounded-lg border border-a2-border p-3 ${message.author_type === "admin" ? "bg-a2-green/10" : "bg-white/[0.03]"}`}>
                    <p className="text-xs font-bold uppercase tracking-wide text-white/40">{message.author_type}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/70">{message.message}</p>
                  </div>
                ))}
                {!(detail?.messages || []).length && <p className="text-sm text-white/45">No messages loaded yet.</p>}
              </div>
              <form className="grid gap-3" onSubmit={sendReply}>
                <textarea className="form-input min-h-28" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write your reply..." />
                <Button type="submit"><Send size={15} /> Send reply</Button>
                {status && <p className="text-sm text-a2-success">{status}</p>}
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ApplicationsView({ applications, compact = false }) {
  return (
    <div className="grid gap-4">
      {!compact && (
        <header>
          <p className="text-sm font-black uppercase tracking-widest text-a2-green">Careers</p>
          <h1 className="mt-2 text-3xl font-black">My applications</h1>
        </header>
      )}
      {compact && applications.length > 0 && <h2 className="text-xl font-black">Recent applications</h2>}
      <div className="grid gap-3">
        {applications.map((application) => (
          <Card key={application.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black">{application.job_title || application.job_id}</p>
                <p className="text-sm text-white/45">Applied {application.created_at?.slice?.(0, 10) || "recently"}</p>
              </div>
              <span className="rounded-full border border-a2-border px-3 py-1 text-sm font-bold text-a2-green">{application.status}</span>
            </div>
            {(application.public_notes || []).map((note) => (
              <div key={note.id} className="mt-3 rounded-lg border border-a2-green/25 bg-a2-green/10 p-3 text-sm text-white/70">
                <p className="text-xs font-black uppercase tracking-wide text-a2-green">Staff note</p>
                <p className="mt-1 whitespace-pre-wrap">{note.note}</p>
              </div>
            ))}
          </Card>
        ))}
        {!applications.length && !compact && <Card className="text-white/55">No applications yet.</Card>}
      </div>
    </div>
  );
}

function SettingsView({ data }) {
  const user = data?.user || {};
  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Account settings</p>
        <h1 className="mt-2 text-3xl font-black">Connections</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black">Discord</h2>
          <p className="mt-2 text-sm text-white/55">{user.discord_id || "Discord is not linked."}</p>
          <Button as="a" href={apiUrl("/api/auth/discord?mode=link")} className="mt-4" variant="ghost">Link Discord</Button>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Steam</h2>
          <p className="mt-2 text-sm text-white/55">{user.steam_id || "Steam is required for character lookup."}</p>
          <Button as="a" href={apiUrl("/api/auth/steam?mode=link")} className="mt-4" variant="ghost">Link Steam</Button>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-a2-border bg-white/[0.03] p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/35">
        {Icon && <Icon size={13} />}
        {label}
      </div>
      <p className="mt-1 font-bold">{value || "Unknown"}</p>
    </div>
  );
}
