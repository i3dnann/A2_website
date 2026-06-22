import { useState } from "react";
import { Lock, RefreshCw, Send } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Button } from "./Button.jsx";
import { Card } from "./Card.jsx";

const closed = (ticket) => String(ticket?.status || "").toLowerCase() === "closed";
const truthy = (value) => value === true || value === 1 || value === "1";

export default function AdminTicketManager() {
  const [tab, setTab] = useState("open");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { data, loading } = useApi(() => api.get(`/api/admin/tickets?status=${tab}&q=${encodeURIComponent(q)}`), [tab, q, refresh], { rows: [] });
  const tickets = data?.rows || [];
  const locked = closed(detail?.ticket || selected);

  const loadTicket = async (ticket) => {
    setSelected(ticket);
    setStatus("");
    setDetail(await api.get(`/api/admin/tickets/${ticket.id}`));
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (locked) return setStatus("Closed ticket is read-only.");
    if (!selected?.id || !reply.trim()) return;
    await api.post(`/api/admin/tickets/${selected.id}/reply`, { message: reply, internal_only: internalOnly });
    setReply("");
    setInternalOnly(false);
    await loadTicket(selected);
    setRefresh((value) => value + 1);
    setStatus(internalOnly ? "Internal reply saved." : "Reply sent to player.");
  };

  const addNote = async () => {
    if (locked) return setStatus("Closed ticket is read-only.");
    if (!selected?.id || !note.trim()) return;
    await api.post(`/api/admin/tickets/${selected.id}/note`, { note });
    setNote("");
    await loadTicket(selected);
    setStatus("Private note saved.");
  };

  const closeTicket = async () => {
    if (!selected?.id) return;
    await api.post(`/api/admin/tickets/${selected.id}/close`, {});
    setReply("");
    setNote("");
    setInternalOnly(false);
    setTab("closed");
    setRefresh((value) => value + 1);
    await loadTicket({ ...selected, status: "Closed" });
    setStatus("Ticket moved to Closed tickets.");
  };

  return (
    <div className="grid gap-5">
      <header><p className="text-sm font-black uppercase tracking-widest text-a2-green">Support</p><h1 className="mt-2 text-3xl font-black">Ticket inbox</h1></header>
      <div className="flex flex-wrap gap-2">
        {[["open", "Open tickets"], ["closed", "Closed tickets"], ["all", "All"]].map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} className={`rounded-lg px-3 py-2 text-sm font-bold ${tab === key ? "bg-a2-green text-black" : "border border-a2-border text-white/60"}`}>{label}</button>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2"><input className="form-input" placeholder="Search tickets..." value={q} onChange={(event) => setQ(event.target.value)} /><Button type="button" variant="ghost" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} /></Button></div>
          <div className="grid max-h-[680px] gap-3 overflow-auto pr-1">
            {(loading ? Array.from({ length: 6 }) : tickets).map((ticket, index) => loading ? <div key={index} className="h-24 rounded skeleton" /> : <TicketButton key={ticket.id} ticket={ticket} selected={selected?.id === ticket.id} onClick={() => loadTicket(ticket)} />)}
            {!loading && !tickets.length && <p className="py-6 text-center text-sm text-white/45">No tickets in this section.</p>}
          </div>
        </Card>
        <Card>
          {!selected ? <p className="text-sm text-white/50">Select a ticket.</p> : (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-black">{detail?.ticket?.subject || selected.subject}</h2><p className="mt-1 text-sm text-white/45">{detail?.ticket?.ticket_number || selected.ticket_number || selected.id}</p>{locked && <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-a2-danger/40 bg-a2-danger/10 px-3 py-1 text-sm font-bold text-a2-danger"><Lock size={14} /> Closed / read-only</p>}</div>{!locked && <Button type="button" variant="danger" onClick={closeTicket}>Close ticket</Button>}</div>
              <LinkedInfo identifiers={detail?.identifiers} />
              <div className="grid max-h-[360px] gap-3 overflow-auto pr-1">{(detail?.messages || []).map((message) => <div key={message.id} className={`rounded-lg border border-a2-border p-3 ${truthy(message.internal_only) ? "bg-a2-warning/10" : message.author_type === "admin" ? "bg-a2-green/10" : "bg-white/[0.03]"}`}><p className="text-xs font-bold uppercase tracking-wide text-white/40">{message.author_type}{truthy(message.internal_only) ? " / internal" : ""}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/70">{message.message}</p></div>)}{!(detail?.messages || []).length && <p className="text-sm text-white/45">No messages yet.</p>}</div>
              {locked ? <div className="rounded-lg border border-a2-border bg-white/[0.03] p-4 text-sm text-white/55">This ticket is closed. Replies and notes are locked.</div> : <ReplyBox reply={reply} setReply={setReply} internalOnly={internalOnly} setInternalOnly={setInternalOnly} sendReply={sendReply} note={note} setNote={setNote} addNote={addNote} />}
              {(detail?.notes || []).map((item) => <p key={item.id} className="rounded-lg bg-black/35 p-3 text-sm text-white/55">{item.note}</p>)}
              {status && <p className="text-sm text-a2-success">{status}</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function TicketButton({ ticket, selected, onClick }) {
  return <button type="button" className="text-left" onClick={onClick}><div className={`rounded-lg border p-4 transition ${selected ? "border-a2-green bg-a2-green/8" : "border-a2-border bg-white/[0.03] hover:border-a2-green/40"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-black">{ticket.subject || "Untitled ticket"}</p><p className="mt-1 text-xs text-white/45">{ticket.ticket_number || ticket.id} / {ticket.category}</p></div><span className="rounded-full border border-a2-border px-2 py-1 text-xs font-bold text-a2-green">{ticket.status}</span></div><p className="mt-2 line-clamp-2 text-sm text-white/50">{ticket.message_preview}</p></div></button>;
}

function ReplyBox({ reply, setReply, internalOnly, setInternalOnly, sendReply, note, setNote, addNote }) {
  return <><form className="grid gap-3" onSubmit={sendReply}><textarea className="form-input min-h-28" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write an answer..." /><label className="flex items-center gap-2 text-sm text-white/60"><input type="checkbox" checked={internalOnly} onChange={(event) => setInternalOnly(event.target.checked)} />Internal reply only admins can see</label><Button type="submit"><Send size={15} /> {internalOnly ? "Save internal reply" : "Send to player"}</Button></form><div className="rounded-lg border border-a2-border bg-white/[0.03] p-4"><div className="mb-2 flex items-center gap-2 text-sm font-black text-a2-warning"><Lock size={15} /> Private admin note</div><textarea className="form-input min-h-20" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Only admins can see this note." /><Button type="button" className="mt-3" variant="ghost" onClick={addNote}>Save note</Button></div></>;
}

function LinkedInfo({ identifiers = {} }) {
  const linked = identifiers.linked_identifiers || [];
  return <div className="rounded-lg border border-a2-border bg-white/[0.03] p-4"><h3 className="font-black">Player linked information</h3><div className="mt-3 grid gap-2 text-sm text-white/60 md:grid-cols-2">{[["User ID", identifiers.user_id], ["Username", identifiers.username], ["Email", identifiers.email], ["Discord ID", identifiers.discord_id], ["Discord name", identifiers.discord_username], ["Steam ID", identifiers.steam_id], ["Steam name", identifiers.steam_persona], ["Citizen ID", identifiers.citizenid]].map(([label, value]) => <div key={label} className="rounded-lg border border-a2-border bg-black/25 p-2"><p className="text-xs uppercase tracking-wide text-white/35">{label}</p><p className="mt-1 break-all font-bold text-white/70">{value || "Not linked"}</p></div>)}</div><div className="mt-3 grid gap-2">{linked.length ? linked.map((item) => <code key={item} className="rounded-lg border border-a2-border bg-black/35 px-3 py-2 text-xs text-a2-green">{item}</code>) : <p className="text-sm text-white/45">No linked identifiers saved.</p>}</div></div>;
}
