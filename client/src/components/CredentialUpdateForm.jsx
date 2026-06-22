import { useState } from "react";
import { KeyRound } from "lucide-react";
import { api } from "../lib/api.js";
import { Button } from "./Button.jsx";
import { Card } from "./Card.jsx";

const emptyForm = { currentCredential: "", newCredential: "", confirmCredential: "" };
const secretType = "password";

export default function CredentialUpdateForm() {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (form.newCredential !== form.confirmCredential) return setError("The new values do not match.");
    if (form.newCredential.length < 8) return setError("Use at least 8 characters.");
    setBusy(true);
    try {
      await api.post("/api/account/password", form);
      setForm(emptyForm);
      setMessage("Updated.");
    } catch (err) {
      setError(err.data?.message || err.data?.error || err.message || "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <KeyRound className="mt-1 text-a2-green" />
        <div>
          <h2 className="text-xl font-black">Change password</h2>
          <p className="mt-1 text-sm leading-6 text-white/55">Update your website account password.</p>
        </div>
      </div>
      <form className="mt-5 grid gap-4 md:max-w-xl" onSubmit={submit}>
        <input className="form-input" type={secretType} placeholder="Current password" value={form.currentCredential} onChange={(event) => setForm((current) => ({ ...current, currentCredential: event.target.value }))} />
        <input className="form-input" type={secretType} placeholder="New password" minLength={8} value={form.newCredential} onChange={(event) => setForm((current) => ({ ...current, newCredential: event.target.value }))} required />
        <input className="form-input" type={secretType} placeholder="Confirm new password" minLength={8} value={form.confirmCredential} onChange={(event) => setForm((current) => ({ ...current, confirmCredential: event.target.value }))} required />
        {error && <div className="rounded-lg border border-a2-danger/40 bg-a2-danger/10 p-3 text-sm text-a2-danger">{error}</div>}
        {message && <div className="rounded-lg border border-a2-success/35 bg-a2-success/10 p-3 text-sm text-white/70">{message}</div>}
        <Button type="submit" disabled={busy}>{busy ? "Updating..." : "Update password"}</Button>
      </form>
    </Card>
  );
}
