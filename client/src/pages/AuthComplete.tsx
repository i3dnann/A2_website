import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";

export default function AuthComplete() {
  const { completeOAuth } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const oauthError = params.get("error");
    if (oauthError) {
      const messages: Record<string, string> = {
        invalid_oauth_state: "Login session expired or was opened from an old link. Please start Discord login again.",
        invalid_steam_state: "Steam login session expired or was opened from an old link. Please start Steam login again."
      };
      setError(messages[oauthError] || "Could not finish login. Please try again.");
      return;
    }
    const token = params.get("token");
    if (!token) {
      setError("Missing login token from the backend.");
      return;
    }

    completeOAuth(token)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch(() => setError("Could not finish login. Please try again."));
  }, [completeOAuth, navigate, params]);

  return (
    <AuthShell title="Finishing login" subtitle="Connecting your account to Gotham City.">
      <div className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : (
          <>
            <Loader2 size={26} className="animate-spin text-orange-300" />
            <p className="text-sm text-white/50">Please wait while we verify your login.</p>
          </>
        )}
      </div>
    </AuthShell>
  );
}
