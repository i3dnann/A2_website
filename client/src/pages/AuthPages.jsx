import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Disc3, Languages, LogIn } from "lucide-react";
import { api, apiUrl } from "../lib/api.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

export function LoginPage() {
  const { user, setUser } = useApp();
  const [error, setError] = useState("");
  const [apiBase, setApiBase] = useState(localStorage.getItem("a2_api_base_url") || "");
  if (user) return <Navigate to="/player/dashboard" replace />;

  const devLogin = async () => {
    setError("");
    try {
      const data = await api.post("/api/auth/dev-login", {});
      setUser(data.user);
      window.location.href = "/player/dashboard";
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-lg border border-a2-green/35 bg-a2-green/10 text-a2-green">
          <Disc3 size={26} />
        </div>
        <h1 className="text-3xl font-black">Login with Discord</h1>
        <p className="mt-3 text-sm leading-6 text-white/56">Discord OAuth is used for identity, roles, permissions, language preference, and secure access to the portal.</p>
        <div className="mt-6 grid gap-3">
          <Button as="a" href={apiUrl("/api/auth/discord")}><LogIn size={16} /> Discord OAuth2 login</Button>
          <Button variant="ghost" onClick={devLogin}>Development master login</Button>
        </div>
        <div className="mt-6 rounded-lg border border-a2-border bg-black/35 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-white/45">Backend API URL</p>
          <p className="mt-1 break-all text-xs text-white/55">{apiUrl("/api/auth/discord")}</p>
          {!apiUrl("/api/auth/discord").startsWith("https://stupor-monologue-raffle.ngrok-free.dev") && (
            <div className="mt-3 grid gap-2">
              <input className="form-input py-2 text-sm" value={apiBase} onChange={(event) => setApiBase(event.target.value)} placeholder="https://stupor-monologue-raffle.ngrok-free.dev" />
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  localStorage.setItem("a2_api_base_url", apiBase.replace(/\/$/, ""));
                  window.location.reload();
                }}
              >
                Save API URL locally
              </Button>
            </div>
          )}
        </div>
        {error && <p className="mt-4 rounded-lg border border-a2-danger/40 bg-a2-danger/10 p-3 text-sm text-a2-danger">{error}</p>}
      </Card>
    </main>
  );
}

export function SelectLanguagePage() {
  const { setLanguage } = useApp();
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-12">
      <Card className="w-full text-center">
        <Languages className="mx-auto mb-4 text-a2-green" size={36} />
        <h1 className="text-3xl font-black">Choose your language</h1>
        <p className="mt-3 text-white/55">The selected language is saved locally before login and in your profile after login.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => setLanguage("en")}>English</Button>
          <Button variant="ghost" onClick={() => setLanguage("ar")}>العربية</Button>
        </div>
      </Card>
    </main>
  );
}

export function LogoutPage() {
  const { setUser } = useApp();
  api.post("/api/auth/logout", {}).finally(() => {
    setUser(null);
    window.location.href = "/";
  });
  return <main className="mx-auto max-w-4xl px-4 py-16"><Card>Logging out...</Card></main>;
}
