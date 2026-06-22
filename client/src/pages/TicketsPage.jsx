import { Link, useNavigate } from "react-router-dom";
import { Send, Ticket } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

function wordCount(value = "") {
  return String(value).trim().split(/\s+/).filter(Boolean).length;
}

function ticketErrorMessage(err) {
  const code = err.data?.error;
  if (code === "ticket_message_too_short" || code === "validation_error") return "Please write at least 10 words in the ticket message.";
  return err.data?.message || code || err.message || "Could not open ticket.";
}

export default function TicketsPage() {
  const { user } = useApp();
  const [form, setForm] = useState({ category: "General support", subject: "", message: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");

    if (wordCount(form.message) < 10) {
      setStatus("Please write at least 10 words in the ticket message.");
      return;
    }

    setBusy(true);
    try {
      await api.post("/api/player/tickets", form);
      setForm({ category: "General support", subject: "", message: "" });
      navigate("/account/tickets", { replace: true });
    } catch (err) {
      setStatus(ticketErrorMessage(err));
    } finally {
      setBusy(false);
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
      <header className="mb-6">
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Support</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">Open a ticket</h1>
        <p className="mt-3 text-sm text-white/55">After submitting, you will be sent directly to your account ticket dashboard.</p>
      </header>
      <Card>
        <form className="grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-bold">
            Category
            <select className="form-input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              {["General support", "Bug report", "Player report", "Staff report", "Compensation request", "Ban question", "Job/career question", "Streamer request", "Other"].map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Subject
            <input className="form-input" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} required />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Message
            <textarea className="form-input min-h-40" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required />
            <span className="text-xs text-white/45">Minimum 10 words.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}><Send size={16} /> {busy ? "Submitting..." : "Submit ticket"}</Button>
            <Button as={Link} to="/account/tickets" variant="ghost">View my tickets</Button>
          </div>
          {status && <p className="text-sm text-a2-danger">{status}</p>}
        </form>
      </Card>
    </main>
  );
}
