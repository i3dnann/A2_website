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
  return (
    <div className="grid gap-5">
      <Header eyebrow="Admin panel" title="A2 Studio control center" />
      <div className="grid gap-4 md:grid-cols-4">
        {(loading ? Array.from({ length: 4 }) : data?.cards || []).map((card, index) => (
          <Card key={card?.label || index}>
            {loading ? <div className="h-20 rounded skeleton" /> : (
              <>
                <p className="text-sm text-white/50">{card.label}</p>
                <p className="mt-2 text-3xl font-black">{card.value}</p>
              </>
            )}
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <MiniList title="Recent tickets" rows={data?.recentTickets || []} />
        <MiniList title="Recent applications" rows={data?.recentApplications || []} />
      </div>
    </div>
  );
}

function MiniList({ title, rows }) {
  return (
    <Card>
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-a2-border bg-white/[0.03] p-3">
            <p className="font-bold">{row.subject || row.title || row.job_id || row.action || row.id}</p>
            <p className="text-xs text-white/45">{row.status || row.created_at}</p>
          </div>
        ))}
        {!rows.length && <p className="text-sm text-white/45">No rows yet.</p>}
      </div>
    </Card>
  );
}

function ResourceTabs({ title, resources, initial }) {
  const [active, setActive] = useState(initial);
  return (
    <div className="grid gap-5">
      <Header eyebrow="CMS" title={title} />
      <div className="flex flex-wrap gap-2">
        {resources.map((resource) => (
          <button key={resource} onClick={() => setActive(resource)} className={`rounded-lg px-3 py-2 text-sm font-bold ${active === resource ? "bg-a2-green text-black" : "border border-a2-border text-white/60"}`}>
            {labelFor(resource)}
          </button>
        ))}
      </div>
      {active === "careerApplications" ? (
        <CareerApplicationsManager embedded />
      ) : (
        <ResourceManager resource={active} title={labelFor(active)} embedded />
      )}
    </div>
  );
}

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

  const loadTicket = async (ticket) => {
    setSelected(ticket);
    setStatus("");
    setDetail(await api.get(`/api/admin/tickets/${ticket.id}`));
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!selected?.id || !reply.trim()) return;
    await api.post(`/api/admin/tickets/${selected.id}/reply`, { message: reply, internal_only: internalOnly });
    setReply("");
    setInternalOnly(false);
    await loadTicket(selected);
    setRefresh((value) => value + 1);
    setStatus(internalOnly ? "Internal reply saved." : "Reply sent to player.");
  };

  const addNote = async () => {
    if (!selected?.id || !note.trim()) return;
    await api.post(`/api/admin/tickets/${selected.id}/note`, { note });
    setNote("");
    await loadTicket(selected);
    setStatus("Private admin note saved.");
  };

  const closeTicket = async () => {
    if (!selected?.id) return;
    await api.post(`/api/admin/tickets/${selected.id}/close`, {});
    await loadTicket(selected);
    setRefresh((value) => value + 1);
    setStatus("Ticket closed.");
  };

  return (
    <div className="grid gap-5">
      <Header eyebrow="Support" title="Ticket inbox" />
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <input className="form-input" placeholder="Search tickets..." value={q} onChange={(event) => setQ(event.target.value)} />
            <Button type="button" variant="ghost" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} /></Button>
          </div>
          <div className="grid max-h-[680px] gap-3 overflow-auto pr-1">
            {(loading ? Array.from({ length: 6 }) : tickets).map((ticket, index) => (
              loading ? <div key={index} className="h-24 rounded skeleton" /> : (
                <button key={ticket.id} type="button" className="text-left" onClick={() => loadTicket(ticket)}>
                  <div className={`rounded-lg border p-4 transition ${selected?.id === ticket.id ? "border-a2-green bg-a2-green/8" : "border-a2-border bg-white/[0.03] hover:border-a2-green/40"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{ticket.subject || "Untitled ticket"}</p>
                        <p className="mt-1 text-xs text-white/45">{ticket.ticket_number || ticket.id} / {ticket.category}</p>
                      </div>
                      <span className="rounded-full border border-a2-border px-2 py-1 text-xs font-bold text-a2-green">{ticket.status}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-white/50">{ticket.message_preview}</p>
                  </div>
                </button>
              )
            ))}
            {!loading && !tickets.length && <p className="py-6 text-center text-sm text-white/45">No tickets yet.</p>}
          </div>
        </Card>

        <Card>
          {!selected ? (
            <p className="text-sm text-white/50">Select a ticket to answer the player.</p>
          ) : (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black">{detail?.ticket?.subject || selected.subject}</h2>
                  <p className="mt-1 text-sm text-white/45">{detail?.ticket?.ticket_number || selected.ticket_number || selected.id}</p>
                </div>
                <Button type="button" variant="danger" onClick={closeTicket}>Close ticket</Button>
              </div>

              <div className="grid max-h-[360px] gap-3 overflow-auto pr-1">
                {(detail?.messages || []).map((message) => (
                  <div key={message.id} className={`rounded-lg border border-a2-border p-3 ${isTrue(message.internal_only) ? "bg-a2-warning/10" : message.author_type === "admin" ? "bg-a2-green/10" : "bg-white/[0.03]"}`}>
                    <p className="text-xs font-bold uppercase tracking-wide text-white/40">{message.author_type}{isTrue(message.internal_only) ? " / internal" : ""}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white/70">{message.message}</p>
                  </div>
                ))}
                {!(detail?.messages || []).length && <p className="text-sm text-white/45">No messages yet.</p>}
              </div>

              <form className="grid gap-3" onSubmit={sendReply}>
                <textarea className="form-input min-h-28" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write an answer..." />
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input type="checkbox" checked={internalOnly} onChange={(event) => setInternalOnly(event.target.checked)} />
                  Internal reply only admins can see
                </label>
                <Button type="submit"><Send size={15} /> {internalOnly ? "Save internal reply" : "Send to player"}</Button>
              </form>

              <div className="rounded-lg border border-a2-border bg-white/[0.03] p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-black text-a2-warning"><Lock size={15} /> Private admin note</div>
                <textarea className="form-input min-h-20" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Only admins can see this note." />
                <Button type="button" className="mt-3" variant="ghost" onClick={addNote}>Save note</Button>
                {(detail?.notes || []).map((item) => (
                  <p key={item.id} className="mt-3 rounded-lg bg-black/35 p-3 text-sm text-white/55">{item.note}</p>
                ))}
              </div>
              {status && <p className="text-sm text-a2-success">{status}</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function CareerApplicationsManager({ embedded = false }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [publicNote, setPublicNote] = useState("");
  const [privateNote, setPrivateNote] = useState("");
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { data, loading } = useApi(() => api.get(`/api/admin/careerApplications?q=${encodeURIComponent(q)}`), [q, refresh], { rows: [] });
  const applications = data?.rows || [];

  const loadApplication = async (application) => {
    setSelected(application);
    setStatus("");
    setDetail(await api.get(`/api/admin/career-applications/${application.id}`));
  };

  const review = async (nextStatus) => {
    if (!selected?.id) return;
    await api.post(`/api/admin/career-applications/${selected.id}/status`, {
      status: nextStatus,
      public_note: publicNote,
      private_note: privateNote,
      reason: nextStatus
    });
    setPublicNote("");
    setPrivateNote("");
    await loadApplication(selected);
    setRefresh((value) => value + 1);
    setStatus(`Application marked ${nextStatus}.`);
  };

  return (
    <div className="grid gap-5">
      {!embedded && <Header eyebrow="Careers" title="Applications" />}
      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <input className="form-input mb-4" placeholder="Search applications..." value={q} onChange={(event) => setQ(event.target.value)} />
          <div className="grid max-h-[620px] gap-3 overflow-auto pr-1">
            {(loading ? Array.from({ length: 6 }) : applications).map((application, index) => (
              loading ? <div key={index} className="h-20 rounded skeleton" /> : (
                <button key={application.id} type="button" className="text-left" onClick={() => loadApplication(application)}>
                  <div className={`rounded-lg border p-4 transition ${selected?.id === application.id ? "border-a2-green bg-a2-green/8" : "border-a2-border bg-white/[0.03] hover:border-a2-green/40"}`}>
                    <p className="font-black">{application.job_id}</p>
                    <p className="mt-1 text-xs text-white/45">User {application.user_id} / Steam {application.steam_id || "none"}</p>
                    <span className="mt-2 inline-flex rounded-full border border-a2-border px-2 py-1 text-xs font-bold text-a2-green">{application.status}</span>
                  </div>
                </button>
              )
            ))}
            {!loading && !applications.length && <p className="py-6 text-center text-sm text-white/45">No applications yet.</p>}
          </div>
        </Card>

        <Card>
          {!selected ? (
            <p className="text-sm text-white/50">Select an application to review answers and send a decision.</p>
          ) : (
            <div className="grid gap-5">
              <div>
                <h2 className="text-2xl font-black">{detail?.job?.title || detail?.application?.job_id || selected.job_id}</h2>
                <p className="mt-1 text-sm text-white/45">Applicant {detail?.application?.user_id || selected.user_id} / Status {detail?.application?.status || selected.status}</p>
              </div>
              <div className="grid gap-3">
                {(detail?.answers || []).map((answer) => (
                  <div key={answer.id} className="rounded-lg border border-a2-border bg-white/[0.03] p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-a2-green">{answer.question_snapshot || answer.question_id}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/70">{answer.answer_text || "No answer"}</p>
                  </div>
                ))}
                {!(detail?.answers || []).length && <p className="text-sm text-white/45">No answers saved for this application.</p>}
              </div>
              <label className="grid gap-2 text-sm font-bold">
                Note to user
                <textarea className="form-input min-h-24" value={publicNote} onChange={(event) => setPublicNote(event.target.value)} placeholder="The applicant can see this note in their account." />
              </label>
              <label className="grid gap-2 text-sm font-bold">
                Private admin note
                <textarea className="form-input min-h-24" value={privateNote} onChange={(event) => setPrivateNote(event.target.value)} placeholder="Only admins can see this." />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => review("Approved")}><Check size={15} /> Approve</Button>
                <Button type="button" variant="danger" onClick={() => review("Denied")}>Deny</Button>
                <Button type="button" variant="ghost" onClick={() => review("Under review")}>Mark under review</Button>
              </div>
              <div className="grid gap-2">
                {(detail?.notes || []).map((note) => (
                  <div key={note.id} className={`rounded-lg border p-3 text-sm ${isTrue(note.is_internal) ? "border-a2-warning/30 bg-a2-warning/10" : "border-a2-green/25 bg-a2-green/10"}`}>
                    <p className="text-xs font-black uppercase tracking-wide text-white/40">{isTrue(note.is_internal) ? "Private note" : "User note"}</p>
                    <p className="mt-1 whitespace-pre-wrap text-white/65">{note.note}</p>
                  </div>
                ))}
              </div>
              {status && <p className="text-sm text-a2-success">{status}</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ResourceManager({ resource, title, embedded = false }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState(newResourceDefaults(resource));
  const [status, setStatus] = useState("");
  const [refresh, setRefresh] = useState(0);
  const { data, loading } = useApi(() => api.get(`/api/admin/${resource}?q=${encodeURIComponent(q)}`), [resource, q, refresh], { rows: [], config: null });
  const rows = data?.rows || [];
  const fields = data?.config?.fields || [];

  useEffect(() => {
    setSelected(null);
    setDraft(newResourceDefaults(resource));
    setStatus("");
  }, [resource]);

  const selectRow = (row) => {
    setSelected(row);
    setDraft(row || newResourceDefaults(resource));
    setStatus("");
  };

  const save = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      const payload = normalizeDraft(draft, fields);
      const response = selected?.id ? await api.patch(`/api/admin/${resource}/${selected.id}`, payload) : await api.post(`/api/admin/${resource}`, payload);
      setSelected(response.row);
      setDraft(response.row);
      setRefresh((value) => value + 1);
      setStatus("Saved.");
    } catch (error) {
      setStatus(error.data?.error || error.message || "Save failed.");
    }
  };

  const remove = async () => {
    if (!selected?.id || !confirm(`Delete ${selected.id}?`)) return;
    await api.delete(`/api/admin/${resource}/${selected.id}`, {});
    setSelected(null);
    setDraft({});
    setRefresh((value) => value + 1);
  };

  return (
    <div className="grid gap-5">
      {!embedded && <Header eyebrow="CMS" title={title} />}
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <input className="form-input" placeholder="Search..." value={q} onChange={(event) => setQ(event.target.value)} />
            <Button type="button" variant="ghost" onClick={() => setRefresh((value) => value + 1)}><RefreshCw size={15} /></Button>
          </div>
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-white/35">
                <tr><th className="py-2">Title</th><th>Status</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {(loading ? Array.from({ length: 8 }) : rows).map((row, index) => (
                  <tr key={row?.id || index} onClick={() => row && selectRow(row)} className="cursor-pointer border-t border-a2-border hover:bg-white/[0.04]">
                    <td className="py-3 font-bold">{loading ? <div className="h-4 rounded skeleton" /> : rowTitle(row)}</td>
                    <td className="py-3 text-white/50">{row ? row.status || String(row.is_visible ?? "") : ""}</td>
                    <td className="py-3 text-white/35">{row?.updated_at?.slice?.(0, 10) || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && !rows.length && <p className="py-6 text-center text-sm text-white/45">No rows yet.</p>}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">{selected ? "Edit item" : "Create item"}</h2>
            <Button type="button" variant="ghost" onClick={() => selectRow(null)}><Plus size={15} /> New</Button>
          </div>
          <form className="grid gap-3" onSubmit={save}>
            {fields.map((field) => (
              <FieldInput key={field} field={field} value={draft[field]} onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))} />
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit"><Save size={15} /> Save</Button>
              {selected?.id && <Button type="button" variant="danger" onClick={remove}><Trash2 size={15} /> Delete</Button>}
            </div>
            {status && <p className={`text-sm ${status === "Saved." ? "text-a2-success" : "text-a2-warning"}`}>{status}</p>}
          </form>
        </Card>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  const label = field.replaceAll("_", " ");
  const booleanFields = new Set(["performanceMode", "maintenanceMode", "partnerGrayscale", "partnerPauseOnHover", "webhookStreamerGoLive", "webhookStreamerGoOffline"]);
  const uploadableUrl = field.endsWith("_url") || ["picture_url", "profile_image_url", "avatar_url", "logo_url", "thumbnail_url", "url"].includes(field);
  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.upload("/api/admin/uploads", formData);
    onChange(response.url);
  };
  if (field.endsWith("_json") || field === "navLinks" || ["content", "description", "bio", "requirements", "internal_notes", "message_preview"].includes(field)) {
    const textValue = typeof value === "object" ? JSON.stringify(value, null, 2) : value || "";
    return <label className="grid gap-2 text-sm font-bold capitalize">{label}<textarea className="form-input min-h-24" value={textValue} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  if (field.startsWith("is_") || field.startsWith("show") || field.endsWith("_enabled") || booleanFields.has(field)) {
    return <label className="flex items-center gap-3 rounded-lg border border-a2-border bg-white/[0.03] p-3 text-sm font-bold capitalize"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
  }
  if (field.endsWith("_date") || ["effective_date", "start_date", "end_date"].includes(field)) {
    return <label className="grid gap-2 text-sm font-bold capitalize">{label}<input className="form-input" type="date" value={dateOnlyInputValue(value)} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  if (field.endsWith("_at")) {
    return <label className="grid gap-2 text-sm font-bold capitalize">{label}<input className="form-input" type="datetime-local" value={dateInputValue(value)} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  if (field.includes("color")) {
    return <label className="grid gap-2 text-sm font-bold capitalize">{label}<input className="form-input h-12" type="color" value={value || "#b7fe1a"} onChange={(event) => onChange(event.target.value)} /></label>;
  }
  if (uploadableUrl) {
    return (
      <label className="grid gap-2 text-sm font-bold capitalize">
        {label}
        <input className="form-input" value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="Paste image/file URL or upload below" />
        <input className="form-input" type="file" accept="image/*,video/*,.pdf" onChange={uploadFile} />
      </label>
    );
  }
  if (field === "kick_username") {
    return <label className="grid gap-2 text-sm font-bold capitalize">{label}<input className="form-input" value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder="Kick username only, for example xqc" /></label>;
  }
  return <label className="grid gap-2 text-sm font-bold capitalize">{label}<input className="form-input" value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SettingsEditor({ mode }) {
  const { setSettings } = useApp();
  const [draft, setDraft] = useState({});
  const [status, setStatus] = useState("");
  const { data, loading } = useApi(() => api.get("/api/admin/settings"), [mode], { settings: {} });
  const fields = settingsFields(mode);

  useEffect(() => {
    setDraft(data?.settings || {});
  }, [data]);

  const save = async (event) => {
    event.preventDefault();
    const payload = normalizeDraft(draft, fields);
    const response = await api.patch(mode === "theme" ? "/api/admin/theme" : "/api/admin/settings", payload);
    setSettings((current) => ({ ...current, ...(response.settings || payload) }));
    setStatus("Saved.");
  };

  return (
    <div className="grid gap-5">
      <Header eyebrow="Website settings" title={settingsTitle(mode)} />
      <Card>
        {loading ? <div className="h-80 rounded skeleton" /> : (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
            {fields.map((field) => <FieldInput key={field} field={field} value={draft[field]} onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))} />)}
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit"><Save size={15} /> Save settings</Button>
              {status && <span className="text-sm text-a2-success">{status}</span>}
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

function UsersManager() {
  return <UserTable endpoint="/api/admin/users" title="Users" defaultRole="Player" />;
}

function AdminsManager() {
  return <UserTable endpoint="/api/admin/admins" title="Admins" defaultRole="Admin" adminActions />;
}

function UserTable({ endpoint, title, defaultRole, adminActions = false }) {
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState({ roles: [defaultRole], permissions: [] });
  const [refresh, setRefresh] = useState(0);
  const { data } = useApi(() => api.get(`${endpoint}?q=${encodeURIComponent(q)}`), [endpoint, q, refresh], { rows: [] });

  const save = async (event) => {
    event.preventDefault();
    const payload = {
      ...draft,
      roles: parseList(draft.roles),
      permissions: parseList(draft.permissions)
    };
    await api.post(endpoint, payload);
    setDraft({ roles: [defaultRole], permissions: [] });
    setRefresh((value) => value + 1);
  };

  const adminStatus = async (id, action) => {
    await api.post(`/api/admin/admins/${id}/${action}`, {});
    setRefresh((value) => value + 1);
  };

  return (
    <div className="grid gap-5">
      <Header eyebrow="Management" title={title} />
      <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <input className="form-input mb-4" placeholder="Search..." value={q} onChange={(event) => setQ(event.target.value)} />
          <div className="grid gap-3">
            {(data?.rows || []).map((user) => (
              <div key={user.id} className="rounded-lg border border-a2-border bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{user.username || user.email}</p>
                    <p className="text-xs text-white/45">{user.email || "No email"} / Discord {user.discord_id || "none"} / Steam {user.steam_id || "none"}</p>
                    <p className="mt-1 text-xs text-a2-green">{user.roles?.join(", ")}</p>
                  </div>
                  <span className="rounded-full border border-a2-border px-3 py-1 text-xs font-bold text-white/60">{user.admin_status || user.account_status}</span>
                </div>
                {adminActions && (
                  <div className="mt-3 flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => adminStatus(user.id, "freeze")}>Freeze</Button>
                    <Button type="button" variant="ghost" onClick={() => adminStatus(user.id, "unfreeze")}>Unfreeze</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black">Add / update {title.toLowerCase()}</h2>
          <form className="mt-4 grid gap-3" onSubmit={save}>
            {["email", "username", "discord_id", "steam_id", "roles", "permissions"].map((field) => (
              <FieldInput key={field} field={field} value={Array.isArray(draft[field]) ? draft[field].join(",") : draft[field]} onChange={(value) => setDraft((current) => ({ ...current, [field]: value }))} />
            ))}
            <Button type="submit"><Check size={15} /> Save</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function PermissionsPage() {
  const { data } = useApi(() => api.get("/api/admin/permissions"), [], { roles: [], permissions: [], defaults: {} });
  return (
    <div className="grid gap-5">
      <Header eyebrow="Security" title="Roles and permissions" />
      <div className="grid gap-4 lg:grid-cols-2">
        {(data?.roles || []).map((role) => (
          <Card key={role}>
            <h2 className="font-black">{role}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(data?.defaults?.[role] || []).map((permission) => <span key={permission} className="rounded-full border border-a2-border px-2 py-1 text-xs text-a2-green">{permission}</span>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WebhooksManager() {
  const [draft, setDraft] = useState({});
  const [status, setStatus] = useState("");
  const { data, setData } = useApi(() => api.get("/api/admin/webhooks"), [], { webhooks: {} });
  const keys = Object.keys(data?.webhooks || {});
  const save = async (event) => {
    event.preventDefault();
    await api.patch("/api/admin/webhooks", draft);
    setStatus("Webhook settings saved.");
    const fresh = await api.get("/api/admin/webhooks");
    setData(fresh);
  };
  return (
    <div className="grid gap-5">
      <Header eyebrow="Discord embeds" title="Webhook settings" />
      <Card>
        <form className="grid gap-4" onSubmit={save}>
          {keys.map((key) => (
            <label key={key} className="grid gap-2 text-sm font-bold">
              {key} {data.webhooks[key]?.configured && <span className="text-a2-success">configured</span>}
              <input className="form-input" type="password" placeholder="Paste new webhook URL to update" value={draft[key] || ""} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} />
            </label>
          ))}
          <Button type="submit"><Save size={15} /> Save webhooks</Button>
          {status && <p className="text-sm text-a2-success">{status}</p>}
        </form>
      </Card>
    </div>
  );
}

function normalizeDraft(draft, fields) {
  const booleanFields = new Set(["performanceMode", "maintenanceMode", "partnerGrayscale", "partnerPauseOnHover", "webhookStreamerGoLive", "webhookStreamerGoOffline"]);
  return Object.fromEntries(
    fields.map((field) => {
      const value = draft[field];
      if (field.startsWith("is_") || field.startsWith("show") || field.endsWith("_enabled") || booleanFields.has(field)) return [field, Boolean(value)];
      if (field.endsWith("_json") || field === "navLinks") return [field, parseJsonField(value)];
      if (field === "kick_username") return [field, cleanKickSlug(value)];
      return [field, value ?? ""];
    })
  );
}

function newResourceDefaults(resource) {
  const defaults = {
    sort_order: 1,
    is_visible: true
  };
  if (resource === "streamers") return { ...defaults, category: "Other", is_featured: false, is_approved: true, is_hidden: false };
  if (resource === "careerJobs") return { ...defaults, is_open: true };
  if (resource === "news") return { ...defaults, status: "Published", published_at: new Date().toISOString() };
  if (resource === "events") return { ...defaults, starts_at: new Date().toISOString(), ends_at: "", status_override: "" };
  if (resource === "mapZones") return { ...defaults, position_x: 50, position_y: 50, color: "#8b5cf6", zone_type: "Point of interest" };
  if (resource === "terms") return { ...defaults, version: "1.0.0", effective_date: new Date().toISOString().slice(0, 10) };
  if (resource === "famous") return { ...defaults, is_featured: true };
  return defaults;
}

function parseJsonField(value) {
  if (typeof value !== "string") return value ?? "";
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isTrue(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function cleanKickSlug(value = "") {
  let input = String(value || "").trim();
  try {
    if (/^https?:\/\//i.test(input)) input = new URL(input).pathname.split("/").filter(Boolean)[0] || "";
  } catch {
    input = input.replace(/^https?:\/\//i, "");
  }
  return input
    .replace(/^www\./i, "")
    .replace(/^kick\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 25);
}

function rowTitle(row) {
  return row.title || row.name || row.partner_name || row.display_name || row.character_name || row.zone_name || row.question || row.subject || row.id;
}

function labelFor(resource) {
  return resource
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .replace("Faq", "FAQ");
}

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.toISOString().slice(0, 16);
}

function dateOnlyInputValue(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return String(value).slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function settingsTitle(mode) {
  if (mode === "home") return "Homepage content";
  if (mode === "theme") return "Theme and colors";
  if (mode === "live") return "Live stream settings";
  return "Website settings";
}

function settingsFields(mode) {
  if (mode === "theme") return ["primaryColor", "backgroundColor", "textColor", "secondaryColor", "cardBackground", "borderColor", "mutedTextColor", "dangerColor", "warningColor", "successColor", "performanceMode"];
  if (mode === "home") return ["websiteName", "logoUrl", "faviconUrl", "heroTitle", "heroSubtitle", "heroDescription", "heroBackgroundImage", "heroBackgroundVideo", "heroOverlayOpacity", "heroPrimaryButtonText", "heroPrimaryButtonLink", "heroSecondaryButtonText", "heroSecondaryButtonLink", "storeButtonText", "storeButtonLink"];
  if (mode === "live") return ["livePageEnabled", "showOfflineStreamers", "showViewerCount", "showThumbnails", "liveStatusCheckIntervalSeconds", "featuredLiveLimit", "webhookStreamerGoLive", "webhookStreamerGoOffline"];
  return ["websiteName", "logoUrl", "faviconUrl", "maintenanceMode", "performanceMode", "navLinks", "termsVersion", "mapImageUrl", "partnersEnabled", "partnerAnimationSpeed", "partnerDirection", "partnerGrayscale", "partnerPauseOnHover"];
}

function Header({ eyebrow, title }) {
  return (
    <header>
      <p className="text-sm font-black uppercase tracking-widest text-a2-green">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black md:text-4xl">{title}</h1>
    </header>
  );
}
