import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Disc3, Gamepad2, LogIn, Mail, Shield } from "lucide-react";
import { api, apiUrl } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

export function LoginPage({ mode = "login" }) {
  const navigate = useNavigate();
  const { settings, setUser, user } = useApp();
  const [isRegister, setIsRegister] = useState(mode === "register");
  const [remember, setRemember] = useState(() => localStorage.getItem("a2_remember_login") !== "false");
  const [form, setForm] = useState(() => ({ username: "", email: localStorage.getItem("a2_remembered_email") || "", password: "", terms: false }));
  const [error, setError] = useState("");
  const { data: providers } = useApi(() => api.get("/api/auth/providers"), [], { discord: {}, steam: {} });

  if (user) return <Navigate to="/account" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const path = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { username: form.username, email: form.email, password: form.password, termsVersion: settings.termsVersion || "1.0.0" }
        : { email: form.email, password: form.password };
      const response = await api.post(path, payload);
      localStorage.setItem("a2_session_token", response.token);
      localStorage.setItem("a2_remember_login", remember ? "true" : "false");
      if (remember) localStorage.setItem("a2_remembered_email", form.email);
      else localStorage.removeItem("a2_remembered_email");
      setUser(response.user);
      navigate("/account");
    } catch (err) {
      setError(err.data?.error || err.message || "Login failed");
    }
  };

  return (
    <main className="mx-auto grid min-h-[78vh] max-w-6xl items-center gap-6 px-4 py-14 lg:grid-cols-[1fr_0.8fr]">
      <section>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Account access</p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/62">
          Use email, Discord, or Steam. Once Discord and Steam are linked from your account, they stay saved and do not need to be connected again each login.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ProviderButton href={apiUrl("/api/auth/discord")} disabled={!providers?.discord?.configured} icon={Disc3} label="Continue with Discord" />
          <ProviderButton href={apiUrl("/api/auth/steam")} disabled={!providers?.steam?.configured} icon={Gamepad2} label="Continue with Steam" />
        </div>
        {providers?.steam?.setupWarning && <p className="mt-3 text-sm text-a2-warning">{providers.steam.setupWarning}</p>}
      </section>

      <Card>
        <div className="mb-5 flex rounded-lg border border-a2-border bg-black/50 p-1">
          <button className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${!isRegister ? "bg-a2-green text-black" : "text-white/60"}`} onClick={() => setIsRegister(false)}>Login</button>
          <button className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${isRegister ? "bg-a2-green text-black" : "text-white/60"}`} onClick={() => setIsRegister(true)}>Register</button>
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          {isRegister && (
            <label className="grid gap-2 text-sm font-bold">
              Username
              <input className="form-input" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} required />
            </label>
          )}
          <label className="grid gap-2 text-sm font-bold">
            Email
            <input className="form-input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Password
            <input className="form-input" type="password" minLength={isRegister ? 8 : 1} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-a2-border bg-white/[0.03] p-3 text-sm text-white/65">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            <span>Remember this login on this browser</span>
          </label>
          {isRegister && (
            <label className="flex items-start gap-3 rounded-lg border border-a2-border bg-white/[0.03] p-3 text-sm text-white/65">
              <input type="checkbox" className="mt-1" checked={form.terms} onChange={(event) => setForm((current) => ({ ...current, terms: event.target.checked }))} required />
              <span>I agree to the current <Link className="text-a2-green" to="/terms">A2 Studio terms</Link>.</span>
            </label>
          )}
          {error && <p className="rounded-lg border border-a2-danger/40 bg-a2-danger/10 p-3 text-sm text-a2-danger">{error}</p>}
          <Button type="submit">
            {isRegister ? <Shield size={16} /> : <LogIn size={16} />}
            {isRegister ? "Create account" : "Login"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

function ProviderButton({ href, disabled, icon: Icon, label }) {
  if (disabled) {
    return (
      <button disabled className="inline-flex items-center justify-center gap-2 rounded-lg border border-a2-border bg-white/5 px-4 py-3 text-sm font-bold text-white/35">
        <Icon size={17} />
        {label}
      </button>
    );
  }
  return (
    <a href={href} className="inline-flex items-center justify-center gap-2 rounded-lg border border-a2-border bg-white/5 px-4 py-3 text-sm font-bold text-white/75 transition hover:border-a2-green/60 hover:text-white">
      <Icon size={17} />
      {label}
    </a>
  );
}

export function AuthCompletePage() {
  const navigate = useNavigate();
  const { setUser } = useApp();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) localStorage.setItem("a2_session_token", token);
    api.get("/api/auth/me").then((response) => {
      setUser(response.user || null);
      navigate("/account", { replace: true });
    });
  }, [navigate, setUser]);

  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <Card>
        <Mail className="mb-4 text-a2-green" />
        <h1 className="text-2xl font-black">Finishing login...</h1>
        <p className="mt-2 text-sm text-white/55">Your account session is being verified.</p>
      </Card>
    </main>
  );
}

export function LogoutPage() {
  const { setUser } = useApp();
  useEffect(() => {
    api.post("/api/auth/logout", {}).finally(() => {
      localStorage.removeItem("a2_session_token");
      setUser(null);
      window.location.href = "/";
    });
  }, [setUser]);
  return <main className="px-4 py-20 text-center text-white/60">Logging out...</main>;
}
