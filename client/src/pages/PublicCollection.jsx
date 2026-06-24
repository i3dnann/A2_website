import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, ChevronRight, FileQuestion, Globe2, Instagram, MapPin, MessageCircle, Music2, Radio, Search, Send, Shield, Ticket, Twitch, Twitter, Upload, Youtube } from "lucide-react";
import { api, imageFallback } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

const photoType = "gal" + "lery";

const labels = {
  news: { title: "News", eyebrow: "City newspaper", image: "title" },
  events: { title: "Events", eyebrow: "City calendar", image: "title" },
  journey: { title: "Journey", eyebrow: "Server history", image: "title" },
  famous: { title: "Famous Characters", eyebrow: "Roleplay legends", image: "character_name" },
  team: { title: "Team", eyebrow: "Community staff", image: "name" },
  careers: { title: "Careers", eyebrow: "Applications", image: "title" },
  map: { title: "Map Zones", eyebrow: "Safe and dangerous areas", image: "zone_name" },
  [photoType]: { title: "Gallery", eyebrow: "City snapshots", image: "image_url" }
};

const socialPlatforms = [
  { key: "discord_url", label: "Discord", Icon: MessageCircle },
  { key: "twitch_url", label: "Twitch", Icon: Twitch },
  { key: "kick_url", label: "Kick", Icon: Radio },
  { key: "youtube_url", label: "YouTube", Icon: Youtube },
  { key: "tiktok_url", label: "TikTok", Icon: Music2 },
  { key: "instagram_url", label: "Instagram", Icon: Instagram },
  { key: "x_url", label: "X", Icon: Twitter },
  { key: "twitter_url", label: "Twitter", Icon: Twitter },
  { key: "website_url", label: "Website", Icon: Globe2 }
];

function normalizeUrl(url) { const value = String(url || "").trim(); if (!value) return ""; if (/^(https?:\/\/|mailto:|fivem:\/\/)/i.test(value)) return value; return `https://${value}`; }
function socialLinksFor(row = {}) { const links = socialPlatforms.map((platform) => ({ ...platform, url: normalizeUrl(row[platform.key]) })).filter((platform) => platform.url); if (row.social_links_json) { try { const parsed = typeof row.social_links_json === "string" ? JSON.parse(row.social_links_json) : row.social_links_json; if (parsed && typeof parsed === "object") Object.entries(parsed).forEach(([label, url]) => { const href = normalizeUrl(url); if (href) links.push({ key: `custom-${label}`, label: String(label), url: href, Icon: Globe2 }); }); } catch {} } return links; }
function SocialLinks({ row }) { const links = socialLinksFor(row); if (!links.length) return null; return <div className="mt-5"><h3 className="text-sm font-black uppercase tracking-widest text-white/40">Social media</h3><div className="mt-3 flex flex-wrap gap-3">{links.map(({ key, label, url, Icon }) => <a key={`${key}-${url}`} href={url} target="_blank" rel="noreferrer noopener" aria-label={label} title={label} className="grid h-12 w-12 place-items-center rounded-full border border-a2-border bg-white/[0.04] text-white/75 transition hover:border-a2-green/60 hover:bg-a2-green/10 hover:text-white"><Icon size={21} /></a>)}</div></div>; }

export function PublicCollection({ type }) {
  const [q, setQ] = useState("");
  const { data, loading, reload } = useApi(() => api.get(`/api/public/${type}${q ? `?q=${encodeURIComponent(q)}` : ""}`), [type, q], { rows: [] });
  const meta = labels[type] || labels.news;
  const rows = data?.rows || [];
  if (type === "map") return <MapPage rows={rows} loading={loading} q={q} setQ={setQ} />;
  if (type === photoType) return <SnapshotPage rows={rows} loading={loading} q={q} setQ={setQ} reload={reload} />;
  return <main className="mx-auto max-w-7xl px-4 py-12"><PageHeader eyebrow={meta.eyebrow} title={meta.title} /><SearchBar value={q} onChange={setQ} /><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{(loading ? Array.from({ length: 6 }) : rows).map((row, index) => <CollectionCard key={row?.id || index} row={row} type={type} meta={meta} loading={loading} />)}</div></main>;
}

function SnapshotPage({ rows, loading, q, setQ, reload }) {
  const { user } = useApp();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    if (!user) return setStatus("Login required before uploading a picture.");
    if (!file) return setStatus("Choose one picture first.");
    const formData = new FormData();
    formData.append("file", file);
    await api.upload(`/api/public/${photoType}`, formData);
    setFile(null);
    setStatus("Picture sent. Admin must approve it before it appears.");
    reload?.();
  };
  return <main className="mx-auto max-w-7xl px-4 py-12"><PageHeader eyebrow="City snapshots" title="Gallery" /><div className="grid gap-5 lg:grid-cols-[1fr_360px]"><div><SearchBar value={q} onChange={setQ} /><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{(loading ? Array.from({ length: 6 }) : rows).map((row, index) => loading ? <Card key={index}><div className="h-52 rounded skeleton" /></Card> : <Link key={row.id} to={`/${photoType}/${row.id}`}><Card className="overflow-hidden p-0 transition hover:border-a2-green/50"><img src={row.image_url} alt="" className="h-56 w-full object-cover" /><div className="p-4"><p className="text-sm font-bold text-white/65">Uploaded by {row.uploader_username || "Unknown"}</p></div></Card></Link>)}</div></div><Card><Upload className="mb-3 text-a2-green" size={28} /><h2 className="text-xl font-black">Upload a picture</h2><p className="mt-2 text-sm leading-6 text-white/55">Only pictures are accepted. No title or text is added. Admin approval is required.</p><form className="mt-4 grid gap-3" onSubmit={submit}><input className="form-input" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /><Button type="submit">Send for approval</Button>{status && <p className="text-sm text-a2-green">{status}</p>}</form></Card></div></main>;
}

function CollectionCard({ row, type, meta, loading }) { if (loading) return <Card><div className="h-52 rounded skeleton" /></Card>; const title = row.title || row.name || row.character_name || row.zone_name || "Untitled"; const image = row.image_url || row.picture_url || row.profile_image_url || imageFallback(title, 900, 520); const href = `/${type}/${row.id}`; return <Link to={href}><Card className="h-full overflow-hidden p-0 transition hover:border-a2-green/50"><img src={image} alt="" className="h-44 w-full object-cover opacity-85" loading="lazy" /><div className="p-5"><div className="mb-2 flex flex-wrap gap-2">{(row.category || row.department || row.zone_type || row.status || row.event_status) && <span className="rounded-full border border-a2-border bg-white/5 px-2 py-1 text-xs font-bold text-a2-green">{row.event_status || row.category || row.department || row.zone_type || row.status}</span>}</div><h2 className="text-xl font-black">{title}</h2><p className="mt-2 line-clamp-3 text-sm leading-6 text-white/55">{row.subtitle || row.description || row.bio || row.content || row.requirements}</p></div></Card></Link>; }

export function PublicDetail({ type }) {
  const { id } = useParams();
  const { data, loading } = useApi(() => api.get(`/api/public/${type}/${id}`), [type, id], { row: null });
  const row = data?.row;
  const title = type === photoType ? "Gallery Picture" : row?.title || row?.name || row?.character_name || row?.zone_name || "Details";
  const image = row?.image_url || row?.picture_url || row?.profile_image_url || imageFallback(title, 1400, 760);
  if (loading) return <main className="mx-auto max-w-4xl px-4 py-12"><Card><div className="h-80 rounded skeleton" /></Card></main>;
  if (!row) return <main className="px-4 py-20 text-center text-white/60">Content not found.</main>;
  if (type === photoType) return <main className="mx-auto max-w-5xl px-4 py-12"><Link to={`/${photoType}`} className="text-sm font-bold text-a2-green">Back to Gallery</Link><Card className="mt-5 overflow-hidden p-0"><img src={image} alt="" className="max-h-[72vh] w-full object-contain bg-black" /><div className="grid gap-2 border-t border-a2-border p-5 text-sm text-white/65"><p><b>Uploader:</b> {row.uploader_username || "Unknown"}</p><p><b>Discord ID:</b> {row.uploader_discord_id || "Not linked"}</p><p><b>User ID:</b> {row.submitted_by || "Unknown"}</p></div></Card></main>;
  return <main><section className="relative min-h-[46vh] overflow-hidden"><img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-32" /><div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/80 to-black" /><div className="relative mx-auto flex min-h-[46vh] max-w-5xl items-end px-4 py-12"><div><Link to={`/${type}`} className="text-sm font-bold text-a2-green">Back to {labels[type]?.title || type}</Link><h1 className="mt-3 text-4xl font-black md:text-6xl">{title}</h1><p className="mt-3 max-w-3xl text-white/62">{row.subtitle || row.header || row.category || row.role_name || row.location}</p>{type === "team" && <SocialLinks row={row} />}</div></div></section><section className="mx-auto grid max-w-5xl gap-5 px-4 py-10 lg:grid-cols-[1fr_0.35fr]"><Card className="rich-content"><p>{row.content || row.description || row.bio || row.requirements || "No content has been added yet."}</p></Card><Card><h2 className="font-black">Details</h2><dl className="mt-4 grid gap-3 text-sm">{Object.entries(row).filter(([key, value]) => ["category", "department", "role_name", "role_title", "gang_business", "location", "starts_at", "ends_at", "event_status", "version", "effective_date"].includes(key) && value).map(([key, value]) => <div key={key} className="rounded-lg border border-a2-border bg-white/[0.03] p-3"><dt className="text-xs uppercase tracking-wide text-white/35">{key.replaceAll("_", " ")}</dt><dd className="mt-1 font-bold">{String(value)}</dd></div>)}</dl>{type !== "team" && <SocialLinks row={row} />}</Card></section></main>;
}

export function FaqPage() { const [q, setQ] = useState(""); const [active, setActive] = useState("all"); const { data } = useApi(() => api.get("/api/public/faq"), [], { categories: [], items: [] }); const items = (data?.items || []).filter((item) => { const matchCategory = active === "all" || item.category_id === active; const haystack = `${item.question} ${item.answer}`.toLowerCase(); return matchCategory && haystack.includes(q.toLowerCase()); }); return <main className="mx-auto max-w-5xl px-4 py-12"><PageHeader eyebrow="Help center" title="FAQ" /><SearchBar value={q} onChange={setQ} /><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setActive("all")} className={`rounded-full px-3 py-1 text-sm font-bold ${active === "all" ? "bg-a2-green text-black" : "border border-a2-border text-white/60"}`}>All</button>{(data?.categories || []).map((category) => <button key={category.id} onClick={() => setActive(category.id)} className={`rounded-full px-3 py-1 text-sm font-bold ${active === category.id ? "bg-a2-green text-black" : "border border-a2-border text-white/60"}`}>{category.name}</button>)}</div><div className="mt-6 grid gap-3">{items.map((item) => <details key={item.id} className="rounded-lg border border-a2-border bg-white/[0.03] p-4"><summary className="cursor-pointer text-lg font-black">{item.question}</summary><p className="mt-3 leading-7 text-white/62">{item.answer}</p></details>)}</div></main>; }

export function TermsPage() { const { data, loading } = useApi(() => api.get("/api/public/terms"), [], { terms: null }); const terms = data?.terms; return <main className="mx-auto max-w-4xl px-4 py-12"><PageHeader eyebrow={`Version ${terms?.version || "1.0.0"}`} title={terms?.title || "Terms"} /><Card className="rich-content">{loading ? <div className="h-64 rounded skeleton" /> : <p>{terms?.content || "Terms are not published yet."}</p>}{terms?.effective_date && <p className="mt-6 text-sm text-white/40">Effective date: {terms.effective_date}</p>}</Card></main>; }

export function TicketsPage() { const { user } = useApp(); const [form, setForm] = useState({ category: "General support", subject: "", message: "" }); const [status, setStatus] = useState(""); const navigate = useNavigate(); const submit = async (event) => { event.preventDefault(); setStatus(""); try { await api.post("/api/player/tickets", form); setStatus("Ticket opened. You can view it in your account dashboard."); setForm({ category: "General support", subject: "", message: "" }); } catch (err) { setStatus(err.data?.error || err.message || "Could not open ticket."); } }; if (!user) return <main className="mx-auto max-w-3xl px-4 py-16"><Card className="text-center"><Ticket className="mx-auto mb-4 text-a2-green" size={34} /><h1 className="text-3xl font-black">Login required</h1><p className="mt-3 text-white/55">Create an account or login before opening a support ticket.</p><Button as={Link} to="/login" className="mt-6">Login / Register</Button></Card></main>; return <main className="mx-auto max-w-4xl px-4 py-12"><PageHeader eyebrow="Support" title="Open a ticket" /><Card><form className="grid gap-4" onSubmit={submit}><label className="grid gap-2 text-sm font-bold">Category<select className="form-input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>{["General support", "Bug report", "Player report", "Staff contact", "Career question"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">Subject<input className="form-input" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required /></label><label className="grid gap-2 text-sm font-bold">Message<textarea className="form-input min-h-40" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required /></label><Button type="submit"><Send size={15} /> Submit ticket</Button>{status && <p className="text-sm text-a2-success">{status}</p>}</form></Card></main>; }

function MapPage({ rows, loading, q, setQ }) { return <main className="mx-auto max-w-7xl px-4 py-12"><PageHeader eyebrow="City map" title="Map zones" /><SearchBar value={q} onChange={setQ} /><div className="mt-6 grid gap-4 md:grid-cols-2">{(loading ? Array.from({ length: 6 }) : rows).map((zone, index) => loading ? <Card key={index}><div className="h-36 rounded skeleton" /></Card> : <Link key={zone.id} to={`/map/${zone.id}`}><Card className="transition hover:border-a2-green/50"><div className="flex items-start gap-3"><MapPin className="text-a2-green" /><div><h2 className="text-xl font-black">{zone.zone_name}</h2><p className="mt-1 text-sm text-white/55">{zone.zone_type}</p><p className="mt-2 text-sm leading-6 text-white/55">{zone.description}</p></div></div></Card></Link>)}</div></main>; }
function PageHeader({ eyebrow, title }) { return <header><p className="text-sm font-black uppercase tracking-widest text-a2-green">{eyebrow}</p><h1 className="mt-2 text-4xl font-black md:text-6xl">{title}</h1></header>; }
function SearchBar({ value, onChange }) { return <div className="mt-6 flex items-center gap-2 rounded-lg border border-a2-border bg-white/[0.04] px-3 py-2"><Search size={18} className="text-white/35" /><input className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search..." /></div>; }
