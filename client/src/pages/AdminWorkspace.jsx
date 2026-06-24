import { useEffect, useMemo, useState } from "react";
import { Check, Lock, Plus, RefreshCw, Save, Send, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

const sectionResources = {
  partners: "partners",
  journey: "journey",
  famous: "famous",
  roster: "streamers",
  team: "team",
  gallery: "gallery",
  careers: "careerJobs",
  tickets: "tickets",
  news: "news",
  map: "mapZones",
  faq: "faqItems",
  terms: "terms",
  events: "events",
  "audit-logs": "auditLogs"
};

const careerResources = ["careerJobs", "careerSections", "careerQuestions", "careerApplications"];
const faqResources = ["faqCategories", "faqItems"];
const galleryFields = ["image_url", "status", "uploader_username", "uploader_discord_id", "submitted_by"];

export function AdminWorkspace({ section = "dashboard", resourceOverride }) {
  if (section === "dashboard") return <AdminDashboard />;
  if (["settings", "home", "theme", "live"].includes(section)) return <SettingsEditor mode={section} />;
  if (section === "users") return <UsersManager />;
  if (section === "admins") return <AdminsManager />;
  if (section === "permissions") return <PermissionsPage />;
  if (section === "webhooks") return <WebhooksManager />;
  if (section === "careers") return <ResourceTabs title="Careers" resources={careerResources} initial={resourceOverride || "careerJobs"} />;
  if (section === "faq") return <ResourceTabs title="FAQ" resources={faqResources} initial="faqItems" />;
  if (section === "tickets") return <TicketManager />;
  const resource = resourceOverride || sectionResources[section] || "partners";
  return <ResourceManager resource={resource} title={labelFor(resource)} />;
}

function AdminDashboard() {
  const { data, loading } = useApi(() => api.get("/api/admin/dashboard"), [], { cards: [], recentTickets: [], recentApplications: [], recentLogs: [] });
  return <div className="grid gap-5"><Header eyebrow="Admin panel" title="A2 Studio control center" /><div className="grid gap-4 md:grid-cols-4">{(loading ? Array.from({ length: 4 }) : data?.cards || []).map((card, index) => <Card key={card?.label || index}>{loading ? <div className="h-20 rounded skeleton" /> : <><p className="text-sm text-white/50">{card.label}</p><p className="mt-2 text-3xl font-black">{card.value}</p></>}</Card>)}</div><div className="grid gap-5 lg:grid-cols-2"><MiniList title="Recent tickets" rows={data?.recentTickets || []} /><MiniList title="Recent applications" rows={data?.recentApplications || []} /></div></div>;
}

function MiniList({ title, rows }) { return <Card><h2 className="text-xl font-black">{title}</h2><div className="mt-4 grid gap-2">{rows.map((row) => <div key={row.id} className="rounded-lg border border-a2-border bg-white/[0.03] p-3"><p className="font-bold">{row.subject || row.title || row.job_id || row.action || row.id}</p><p className="text-xs text-white/45">{row.status || row.created_at}</p></div>)}{!rows.length && <p className="text-sm text-white/45">No rows yet.</p>}</div></Card>; }

function ResourceTabs({ title, resources, initial }) { const [active, setActive] = useState(initial); return <div className="grid gap-5"><Header eyebrow="CMS" title={title} /><div className="flex flex-wrap gap-2">{resources.map((resource) => <button key={resource} onClick={() => setActive(resource)} className={`rounded-lg px-3 py-2 text-sm font-bold ${active === resource ? "bg-a2-green text-black" : "border border-a2-border text-white/60"}`}>{labelFor(resource)}</button>)}</div>{active === "careerApplications" ? <CareerApplicationsManager embedded /> : <ResourceManager resource={active} title={labelFor(active)} embedded />}</div>; }

function TicketManager() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { data, loading } = useApi(() => api.get(`/api/admin/tickets?q=${encodeURIComponent(q)}`), [q, refresh], { rows: [] });
  const tickets = data?.rows || [];
  const loadTicket = async (ticket) => { setSelected(ticket); setStatus(""); setDetail(await api.get(`/api/admin/tickets/${ticket.id}`)); };
  const sendReply = async (event) => { event.preventDefault(); if (!selected?.id || !reply.trim()) return; await api.post(`/api/admin/tickets/${selected.id}/reply`, { message: reply, internal_only: internalOnly }); setReply(""); setInternalOnly(false); await loadTicket(selected); setRefresh((value) => value + 1); setStatus(internalOnly ? "Internal reply saved." : "Reply sent to player."); };
  const addNote = async () => { if (!selected?.id || !note.trim()) return; await api.post(`/api/admin/tickets/${selected.id}/note`, { note }); setNote(""); await loadTicket(selected); setStatus("Private admin note saved."); };
  const closeTicket = async () => { if (!selected?.id) return; await api.post(`/api/admin/tickets/${selected.id}/close`, {}); await loadTicket(selected); setRefresh((value) => value + 1); setStatus("Ticket closed."); };
  return <div className="grid gap-5"><Header eyebrow="Support" title="Ticket inbox" /><div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]"><Card><div className="mb-4 flex items-center gap-2"><input className="form-input" placeholder="Search tickets..." value={q} onChange={(event) => setQ(event.target.value)} /><Button type="button" variant="ghost" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} /></Button></div><div className="grid max-h-[680px] gap-3 overflow-auto pr-1">{(loading ? Array.from({ length: 6 }) : tickets).map((ticket, index) => loading ? <div key={index} className="h-24 rounded skeleton" /> : <button key={ticket.id} type="button" className="text-left" onClick={() => loadTicket(ticket)}><div className={`rounded-lg border p-4 transition ${selected?.id === ticket.id ? "border-a2-green bg-a2-green/8" : "border-a2-border bg-white/[0.03] hover:border-a2-green/40"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-black">{ticket.subject || "Untitled ticket"}</p><p className="mt-1 text-xs text-white/45">{ticket.ticket_number || ticket.id} / {ticket.category}</p></div><span className="rounded-full border border-a2-border px-2 py-1 text-xs font-bold text-a2-green">{ticket.status}</span></div><p className="mt-2 line-clamp-2 text-sm text-white/50">{ticket.message_preview}</p></div></button>)}{!loading && !tickets.length && <p className="py-6 text-center text-sm text-white/45">No tickets yet.</p>}</div></Card><Card>{!selected ? <p className="text-sm text-white/50">Select a ticket to answer the player.</p> : <div className="grid gap-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-black">{detail?.ticket?.subject || selected.subject}</h2><p className="mt-1 text-sm text-white/45">{detail?.ticket?.ticket_number || selected.ticket_number || selected.id}</p></div><Button type="button" variant="danger" onClick={closeTicket}>Close ticket</Button></div><div className="grid max-h-[360px] gap-3 overflow-auto pr-1">{(detail?.messages || []).map((message) => <div key={message.id} className={`rounded-lg border border-a2-border p-3 ${isTrue(message.internal_only) ? "bg-a2-warning/10" : message.author_type === "admin" ? "bg-a2-green/10" : "bg-white/[0.03]"}`}><p className="text-xs font-bold uppercase tracking-wide text-white/40">{message.author_type}{isTrue(message.internal_only) ? " / internal" : ""}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/70">{message.message}</p></div>)}{!(detail?.messages || []).length && <p className="text-sm text-white/45">No messages yet.</p>}</div><form className="grid gap-3" onSubmit={sendReply}><textarea className="form-input min-h-28" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write an answer..." /><label className="flex items-center gap-2 text-sm text-white/60"><input type="checkbox" checked={internalOnly} onChange={(event) => setInternalOnly(event.target.checked)} />Internal reply only admins can see</label><Button type="submit"><Send size={15} /> {internalOnly ? "Save internal reply" : "Send to player"}</Button></form><div className="rounded-lg border border-a2-border bg-white/[0.03] p-4"><div className="mb-2 flex items-center gap-2 text-sm font-black text-a2-warning"><Lock size={15} /> Private admin note</div><textarea className="form-input min-h-20" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Only admins can see this note." /><Button type="button" className="mt-3" variant="ghost" onClick={addNote}>Save note</Button>{(detail?.notes || []).map((item) => <p key={item.id} className="mt-3 rounded-lg bg-black/35 p-3 text-sm text-white/55">{item.note}</p>)}</div>{status && <p className="text-sm text-a2-success">{status}</p>}</div>}</Card></div></div>;
}

function CareerApplicationsManager() { return <ResourceManager resource="careerApplications" title="Career Applications" />; }
function UsersManager() { return <SimplePanel title="Users" />; }
function AdminsManager() { return <SimplePanel title="Admins" />; }
function PermissionsPage() { return <SimplePanel title="Permissions" />; }
function WebhooksManager() { return <SimplePanel title="Webhooks" />; }
function SimplePanel({ title }) { return <div className="grid gap-5"><Header eyebrow="Admin" title={title} /><Card><p className="text-sm text-white/55">Use the admin section controls for this page.</p></Card></div>; }

function ResourceManager({ resource, title, embedded = false }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(newResourceDefaults(resource));
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { data, loading } = useApi(() => api.get(`/api/admin/${resource}?q=${encodeURIComponent(q)}`), [resource, q, refresh], { rows: [], config: null });
  const rows = data?.rows || [];
  const fields = data?.config?.fields?.length ? data.config.fields : (resource === "gallery" ? galleryFields : ["title", "description", "image_url", "status", "sort_order", "is_visible"]);
  useEffect(() => { setSelected(null); setDraft(newResourceDefaults(resource)); setStatus(""); }, [resource]);
  const selectRow = (row) => { setSelected(row); setDraft(row || newResourceDefaults(resource)); setStatus(""); };
  const save = async (event) => { event.preventDefault(); const payload = normalizeDraft(draft, fields); const response = selected?.id ? await api.patch(`/api/admin/${resource}/${selected.id}`, payload) : await api.post(`/api/admin/${resource}`, payload); setSelected(response.row); setDraft(response.row); setRefresh((value) => value + 1); setStatus("Saved."); };
  const remove = async () => { if (!selected?.id) return; await api.delete(`/api/admin/${resource}/${selected.id}`, {}); setSelected(null); setDraft(newResourceDefaults(resource)); setRefresh((value) => value + 1); };
  return <div className="grid gap-5">{!embedded && <Header eyebrow="CMS" title={title} />}<div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]"><Card><div className="mb-4 flex items-center gap-2"><input className="form-input" placeholder="Search..." value={q} onChange={(event) => setQ(event.target.value)} /><Button type="button" variant="ghost" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} /></Button></div><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-white/35"><tr><th className="py-2">Title</th><th>Status</th><th>Updated</th></tr></thead><tbody>{(loading ? Array.from({ length: 8 }) : rows).map((row, index) => <tr key={row?.id || index} onClick={() => row && selectRow(row)} className="cursor-pointer border-t border-a2-border hover:bg-white/[0.04]"><td className="py-3 font-bold">{loading ? <div className="h-4 rounded skeleton" /> : rowTitle(row)}</td><td className="py-3 text-white/50">{row ? row.status || String(row.is_visible ?? "") : ""}</td><td className="py-3 text-white/35">{row?.updated_at?.slice?.(0, 10) || ""}</td></tr>)}</tbody></table>{!loading && !rows.length && <p className="py-6 text-center text-sm text-white/45">No rows yet.</p>}</Card><Card><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-black">{selected ? "Edit item" : "Create item"}</h2><Button type="button" variant="ghost" onClick={() => selectRow(null)}><Plus size={15} /> New</Button></div><form className="grid gap-3" onSubmit={save}>{fields.map((field) => <FieldInput key={field} field={field} value={draft[field]} onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))} />)}<div className="flex flex-wrap gap-2 pt-2"><Button type="submit"><Save size={15} /> Save</Button>{selected?.id && <Button type="button" variant="danger" onClick={remove}><Trash2 size={15} /> Remove</Button>}</div>{status && <p className="text-sm text-a2-success">{status}</p>}</form></Card></div></div>;
}

function SettingsEditor({ mode }) { const { data } = useApi(() => api.get("/api/public/settings"), [mode], { settings: {} }); const [draft, setDraft] = useState({}); const [status, setStatus] = useState(""); const fields = settingsFields(mode); useEffect(() => setDraft(data?.settings || {}), [data]); const save = async (event) => { event.preventDefault(); await api.patch("/api/admin/theme", normalizeDraft(draft, fields)); setStatus("Saved."); }; return <div className="grid gap-5"><Header eyebrow="Settings" title={settingsTitle(mode)} /><Card><form className="grid gap-3" onSubmit={save}>{fields.map((field) => <FieldInput key={field} field={field} value={draft[field]} onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))} />)}<Button type="submit"><Save size={15} /> Save</Button>{status && <p className="text-sm text-a2-success">{status}</p>}</form></Card></div>; }
function FieldInput({ field, value, onChange }) { const label = field.replaceAll("_", " ").replace(/([A-Z])/g, " $1"); if (typeof value === "boolean" || field.startsWith("is_") || field.startsWith("show") || field.endsWith("_enabled")) return <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />{label}</label>; if (String(value || "").length > 120 || ["content", "description", "bio", "requirements", "heroDescription"].includes(field)) return <label className="grid gap-2 text-sm font-bold capitalize">{label}<textarea className="form-input min-h-28" value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>; return <label className="grid gap-2 text-sm font-bold capitalize">{label}<input className="form-input" value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>; }
function normalizeDraft(draft, fields) { return Object.fromEntries(fields.map((field) => [field, draft[field] ?? ""])); }
function newResourceDefaults(resource) { if (resource === "gallery") return { status: "Approved" }; return { sort_order: 1, is_visible: true }; }
function rowTitle(row) { return row.title || row.name || row.partner_name || row.display_name || row.character_name || row.zone_name || row.question || row.subject || row.uploader_username || row.id; }
function isTrue(value) { return value === true || value === 1 || value === "1" || value === "true"; }
function labelFor(resource) { return resource.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase()).replace("Faq", "FAQ"); }
function settingsTitle(mode) { if (mode === "home") return "Homepage content"; if (mode === "theme") return "Theme and colors"; if (mode === "live") return "Live stream settings"; return "Website settings"; }
function settingsFields(mode) { if (mode === "home") return ["websiteName", "logoUrl", "faviconUrl", "heroTitle", "heroSubtitle", "heroDescription", "heroBackgroundImage", "heroPrimaryButtonText", "heroPrimaryButtonLink", "heroSecondaryButtonText", "heroSecondaryButtonLink", "storeSupportVisible", "storeTitle", "storeDescription", "storeButtonText", "storeButtonLink"]; if (mode === "theme") return ["primaryColor", "backgroundColor", "textColor", "secondaryColor", "cardBackground", "borderColor", "mutedTextColor", "dangerColor", "warningColor", "successColor", "performanceMode"]; if (mode === "live") return ["livePageEnabled", "showOfflineStreamers", "showViewerCount", "showThumbnails", "featuredLiveLimit"]; return ["websiteName", "logoUrl", "faviconUrl", "maintenanceMode", "performanceMode", "partnersEnabled", "mapImageUrl"]; }
function Header({ eyebrow, title }) { return <header><p className="text-sm font-black uppercase tracking-widest text-a2-green">{eyebrow}</p><h1 className="mt-2 text-3xl font-black md:text-4xl">{title}</h1></header>; }
