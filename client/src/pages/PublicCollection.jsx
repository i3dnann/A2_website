import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, ChevronRight, FileQuestion, MapPin, Search, Send, Shield, Ticket } from "lucide-react";
import { api, imageFallback } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

const labels = {
  news: { title: "News", eyebrow: "City newspaper", image: "title" },
  events: { title: "Events", eyebrow: "City calendar", image: "title" },
  journey: { title: "Journey", eyebrow: "Server history", image: "title" },
  famous: { title: "Famous Characters", eyebrow: "Roleplay legends", image: "character_name" },
  team: { title: "Team", eyebrow: "Community staff", image: "name" },
  careers: { title: "Careers", eyebrow: "Applications", image: "title" },
  map: { title: "Map Zones", eyebrow: "Safe and dangerous areas", image: "zone_name" }
};

export function PublicCollection({ type }) {
  const [q, setQ] = useState("");
  const { data, loading } = useApi(() => api.get(`/api/public/${type}${q ? `?q=${encodeURIComponent(q)}` : ""}`), [type, q], { rows: [] });
  const meta = labels[type] || labels.news;
  const rows = data?.rows || [];

  if (type === "map") return <MapPage rows={rows} loading={loading} q={q} setQ={setQ} />;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <PageHeader eyebrow={meta.eyebrow} title={meta.title} />
      <SearchBar value={q} onChange={setQ} />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(loading ? Array.from({ length: 6 }) : rows).map((row, index) => (
          <CollectionCard key={row?.id || index} row={row} type={type} meta={meta} loading={loading} />
        ))}
      </div>
    </main>
  );
}

function CollectionCard({ row, type, meta, loading }) {
  if (loading) return <Card><div className="h-52 rounded skeleton" /></Card>;
  const title = row.title || row.name || row.character_name || row.zone_name || "Untitled";
  const image = row.image_url || row.picture_url || row.profile_image_url || imageFallback(title, 900, 520);
  const href = `/${type}/${row.id}`;
  return (
    <Link to={href}>
      <Card className="h-full overflow-hidden p-0 transition hover:border-a2-green/50">
        <img src={image} alt="" className="h-44 w-full object-cover opacity-85" loading="lazy" />
        <div className="p-5">
          <div className="mb-2 flex flex-wrap gap-2">
            {(row.category || row.department || row.zone_type || row.status || row.event_status) && (
              <span className="rounded-full border border-a2-border bg-white/5 px-2 py-1 text-xs font-bold text-a2-green">{row.event_status || row.category || row.department || row.zone_type || row.status}</span>
            )}
          </div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/55">{row.subtitle || row.description || row.bio || row.content || row.requirements}</p>
        </div>
      </Card>
    </Link>
  );
}

export function PublicDetail({ type }) {
  const { id } = useParams();
  const { data, loading } = useApi(() => api.get(`/api/public/${type}/${id}`), [type, id], { row: null });
  const row = data?.row;
  const title = row?.title || row?.name || row?.character_name || row?.zone_name || "Details";
  const image = row?.image_url || row?.picture_url || row?.profile_image_url || imageFallback(title, 1400, 760);

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-12"><Card><div className="h-80 rounded skeleton" /></Card></main>;
  if (!row) return <main className="px-4 py-20 text-center text-white/60">Content not found.</main>;

  return (
    <main>
      <section className="relative min-h-[46vh] overflow-hidden">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-32" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/80 to-black" />
        <div className="relative mx-auto flex min-h-[46vh] max-w-5xl items-end px-4 py-12">
          <div>
            <Link to={`/${type}`} className="text-sm font-bold text-a2-green">Back to {labels[type]?.title || type}</Link>
            <h1 className="mt-3 text-4xl font-black md:text-6xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-white/62">{row.subtitle || row.header || row.category || row.role_name || row.location}</p>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10 lg:grid-cols-[1fr_0.35fr]">
        <Card className="rich-content">
          <p>{row.content || row.description || row.bio || row.requirements || "No content has been added yet."}</p>
        </Card>
        <Card>
          <h2 className="font-black">Details</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            {Object.entries(row)
              .filter(([key, value]) => ["category", "department", "role_name", "gang_business", "location", "starts_at", "ends_at", "event_status", "version", "effective_date"].includes(key) && value)
              .map(([key, value]) => (
                <div key={key} className="rounded-lg border border-a2-border bg-white/[0.03] p-3">
                  <dt className="text-xs uppercase tracking-wide text-white/35">{key.replaceAll("_", " ")}</dt>
                  <dd className="mt-1 font-bold">{String(value)}</dd>
                </div>
              ))}
          </dl>
        </Card>
      </section>
    </main>
  );
}

export function FaqPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("all");
  const { data } = useApi(() => api.get("/api/public/faq"), [], { categories: [], items: [] });
  const items = (data?.items || []).filter((item) => {
    const matchCategory = active === "all" || item.category_id === active;
    const haystack = `${item.question} ${item.answer}`.toLowerCase();
    return matchCategory && haystack.includes(q.toLowerCase());
  });
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow="Help center" title="FAQ" />
      <SearchBar value={q} onChange={setQ} />
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setActive("all")} className={`rounded-full px-3 py-1 text-sm font-bold ${active === "all" ? "bg-a2-green text-black" : "border border-a2-border text-white/60"}`}>All</button>
        {(data?.categories || []).map((category) => (
          <button key={category.id} onClick={() => setActive(category.id)} className={`rounded-full px-3 py-1 text-sm font-bold ${active === category.id ? "bg-a2-green text-black" : "border border-a2-border text-white/60"}`}>{category.name}</button>
        ))}
      </div>
      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <details key={item.id} className="rounded-lg border border-a2-border bg-white/[0.03] p-4">
            <summary className="cursor-pointer text-lg font-black">{item.question}</summary>
            <p className="mt-3 leading-7 text-white/62">{item.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}

export function TermsPage() {
  const { data, loading } = useApi(() => api.get("/api/public/terms"), [], { terms: null });
  const terms = data?.terms;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader eyebrow={`Version ${terms?.version || "1.0.0"}`} title={terms?.title || "Terms"} />
      <Card className="rich-content">
        {loading ? <div className="h-64 rounded skeleton" /> : <p>{terms?.content || "Terms are not published yet."}</p>}
        {terms?.effective_date && <p className="mt-6 text-sm text-white/40">Effective date: {terms.effective_date}</p>}
      </Card>
    </main>
  );
}

export function TicketsPage() {
  const { user } = useApp();
  const [form, setForm] = useState({ category: "General support", subject: "", message: "" });
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await api.post("/api/player/tickets", form);
      setStatus("Ticket opened. You can view it in your account dashboard.");
      setForm({ category: "General support", subject: "", message: "" });
    } catch (err) {
      setStatus(err.data?.error || err.message || "Could not open ticket.");
    }
  };

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Card className="text-center">
          <Ticket className="mx-auto mb-4 text-a2-green" size={34} />
          <h1 className="text-3xl font-black">Login required</h1>
          <p className="mt-3 text-white/55">Create an account or login before opening a support ticket.</p>
          <Button as={Link} to="/login" className="mt-6">Login / Register</Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader eyebrow="Support" title="Open a ticket" />
      <Card>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-bold">
            Category
            <select className="form-input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              {["General support", "Bug report", "Player report", "Staff report", "Compensation request", "Ban question", "Job/career question", "Streamer request", "Other"].map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Subject
            <input className="form-input" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Message
            <textarea className="form-input min-h-40" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required />
          </label>
          <Button type="submit"><Send size={16} /> Submit ticket</Button>
          {status && <p className="text-sm text-white/60">{status}</p>}
        </form>
      </Card>
    </main>
  );
}

export function CareerDetailPage() {
  const { id } = useParams();
  const { user, settings } = useApp();
  const { data, loading } = useApi(() => api.get(`/api/public/careers/${id}`), [id], { job: null, sections: [], questions: [] });
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState("");
  const job = data?.job;

  const submit = async (event) => {
    event.preventDefault();
    if (!user) return setStatus("Login before applying.");
    const payload = {
      termsVersion: settings.termsVersion || "1.0.0",
      answers: (data?.questions || []).map((question) => ({
        section_id: question.section_id,
        question_id: question.id,
        question: question.question,
        answer: answers[question.id] || ""
      }))
    };
    try {
      await api.post(`/api/player/careers/${id}/apply`, payload);
      setStatus("Application submitted.");
    } catch (err) {
      setStatus(err.data?.error || err.message || "Could not submit application.");
    }
  };

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-12"><Card><div className="h-80 rounded skeleton" /></Card></main>;
  if (!job) return <main className="px-4 py-20 text-center text-white/60">Career not found.</main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <PageHeader eyebrow={job.department || "Career"} title={job.title} />
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <img src={job.image_url || imageFallback(job.title, 800, 500)} alt="" className="mb-4 h-52 w-full rounded-lg object-cover" />
          <p className="leading-7 text-white/62">{job.description}</p>
          <p className="mt-4 text-sm font-bold text-a2-green">{job.is_open ? "Applications open" : "Applications closed"}</p>
          <p className="mt-2 text-sm text-white/50">{job.requirements}</p>
        </Card>
        <Card>
          <form className="grid gap-5" onSubmit={submit}>
            {(data?.sections || []).map((section) => (
              <section key={section.id} className="rounded-lg border border-a2-border bg-white/[0.03] p-4">
                <h2 className="text-xl font-black">{section.title}</h2>
                <p className="mt-1 text-sm text-white/50">{section.description}</p>
                <div className="mt-4 grid gap-3">
                  {(data?.questions || []).filter((question) => question.section_id === section.id).map((question) => (
                    <QuestionInput key={question.id} question={question} value={answers[question.id] || ""} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} />
                  ))}
                </div>
              </section>
            ))}
            <label className="flex gap-3 text-sm text-white/60">
              <input type="checkbox" required />
              <span>I agree to the current terms and understand staff will review my account, Discord, Steam, and linked characters.</span>
            </label>
            <Button type="submit" disabled={!user || !job.is_open}>Submit application</Button>
            {!user && <p className="text-sm text-a2-warning">Login before applying.</p>}
            {status && <p className="text-sm text-white/60">{status}</p>}
          </form>
        </Card>
      </div>
    </main>
  );
}

function QuestionInput({ question, value, onChange }) {
  const type = question.question_type || "short_text";
  const options = safeOptions(question.options_json);
  if (type === "long_text") return <label className="grid gap-2 text-sm font-bold">{question.question}<textarea className="form-input min-h-28" value={value} onChange={(event) => onChange(event.target.value)} required={question.is_required} /></label>;
  if (type === "dropdown") return <label className="grid gap-2 text-sm font-bold">{question.question}<select className="form-input" value={value} onChange={(event) => onChange(event.target.value)} required={question.is_required}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
  if (type === "checkbox") return <label className="flex gap-3 text-sm font-bold"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked ? "Yes" : "")} required={question.is_required} />{question.question}</label>;
  return <label className="grid gap-2 text-sm font-bold">{question.question}<input className="form-input" type={type === "number" ? "number" : type === "date" ? "date" : "text"} value={value} onChange={(event) => onChange(event.target.value)} required={question.is_required} /></label>;
}

function safeOptions(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) && parsed.length ? parsed : ["Select"];
  } catch {
    return ["Select"];
  }
}

function MapPage({ rows, q, setQ }) {
  const [activeType, setActiveType] = useState("all");
  const types = useMemo(() => ["all", ...new Set(rows.map((zone) => zone.zone_type).filter(Boolean))], [rows]);
  const filtered = rows.filter((zone) => activeType === "all" || zone.zone_type === activeType);
  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <PageHeader eyebrow="City map" title="Safe and danger zones" />
      <SearchBar value={q} onChange={setQ} />
      <div className="mt-4 flex flex-wrap gap-2">
        {types.map((type) => (
          <button key={type} onClick={() => setActiveType(type)} className={`rounded-full px-3 py-1 text-sm font-bold ${activeType === type ? "bg-a2-green text-black" : "border border-a2-border text-white/60"}`}>{type}</button>
        ))}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.4fr]">
        <div className="map-board">
          {filtered.map((zone) => (
            <button key={zone.id} className="zone-marker group" style={{ left: `${Number(zone.position_x || 50)}%`, top: `${Number(zone.position_y || 50)}%` }}>
              <span className="grid h-12 w-12 place-items-center rounded-full border-2 bg-black/80 shadow-glow" style={{ borderColor: zone.color || "#b7fe1a", color: zone.color || "#b7fe1a" }}>
                <MapPin size={22} />
              </span>
              <span className="absolute left-1/2 top-full mt-2 hidden w-56 -translate-x-1/2 rounded-lg border border-a2-border bg-black p-3 text-left text-xs group-hover:block">
                <strong>{zone.zone_name}</strong>
                <span className="mt-1 block text-white/55">{zone.description}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="grid gap-3">
          {filtered.map((zone) => (
            <Card key={zone.id}>
              <div className="flex items-start gap-3">
                <Shield style={{ color: zone.color || "#b7fe1a" }} />
                <div>
                  <p className="font-black">{zone.zone_name}</p>
                  <p className="text-sm text-a2-green">{zone.zone_type}</p>
                  <p className="mt-2 text-sm text-white/55">{zone.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

function PageHeader({ eyebrow, title }) {
  return (
    <header>
      <p className="text-sm font-black uppercase tracking-widest text-a2-green">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black md:text-5xl">{title}</h1>
    </header>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <label className="mt-6 flex items-center gap-2 rounded-lg border border-a2-border bg-white/[0.03] px-3 py-2">
      <Search size={17} className="text-white/35" />
      <input className="w-full bg-transparent text-sm outline-none" placeholder="Search..." value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
