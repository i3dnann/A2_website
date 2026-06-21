import { useState } from "react";
import { api } from "../lib/api.js";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

const ticketTypes = ["Player report", "Staff report", "Compensation request", "Bug report", "Lost items", "Whitelist issue", "General support", "Donation/cosmetic issue", "Streamer/content creator request"];

export function ApplyPage() {
  return <SubmissionForm title="Whitelist Application" endpoint="/api/player/whitelist" fields={["character_name", "age", "language", "backstory", "roleplay_experience"]} agreementText="I confirm my age, accept the rules, and agree to the terms." />;
}

export function BanAppealPage() {
  return <SubmissionForm title="Ban Appeal" endpoint="/api/player/ban-appeals" fields={["ban_id", "citizenid", "ban_reason", "player_explanation", "why_unban"]} agreementText="I confirm this appeal is honest and complete." />;
}

export function TicketsPage() {
  return <SubmissionForm title="Create Ticket" endpoint="/api/player/tickets" fields={["title", "ticket_type", "description"]} choices={{ ticket_type: ticketTypes }} agreementText="I understand staff actions are logged." />;
}

function SubmissionForm({ title, endpoint, fields, choices = {}, agreementText }) {
  const [form, setForm] = useState({});
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      await api.post(endpoint, { ...form, age_confirmed: agreed, rules_agreed: agreed, terms_agreed: agreed });
      setStatus("Submitted successfully.");
      setForm({});
      setAgreed(false);
    } catch (error) {
      setStatus(error.status === 401 ? "Please login with Discord first." : error.message);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <p className="text-sm font-black uppercase tracking-wide text-a2-green">Player portal</p>
        <h1 className="mt-2 text-4xl font-black">{title}</h1>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          {fields.map((field) => (
            <label key={field} className="grid gap-2 text-sm font-bold text-white/72">
              {field.replaceAll("_", " ")}
              {choices[field] ? (
                <select className="form-input" value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}>
                  <option className="bg-black" value="">Select...</option>
                  {choices[field].map((choice) => <option className="bg-black" key={choice}>{choice}</option>)}
                </select>
              ) : field.includes("description") || field.includes("backstory") || field.includes("explanation") || field.includes("why") ? (
                <textarea className="form-input min-h-32" value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
              ) : (
                <input className="form-input" value={form[field] || ""} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} />
              )}
            </label>
          ))}
          <label className="flex items-center gap-3 rounded-lg border border-a2-border bg-white/[0.03] p-3 text-sm text-white/62">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            {agreementText}
          </label>
          <Button disabled={!agreed}>Submit</Button>
          {status && <p className="text-sm text-white/62">{status}</p>}
        </form>
      </Card>
    </main>
  );
}
