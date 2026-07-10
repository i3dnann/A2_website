import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export default function AuthComplete() {
  const { completeOAuth } = useAuth();
  const { t } = useLanguage();
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
        invalid_oauth_state: t("Login session expired or was opened from an old link. Please start Discord login again."),
        invalid_steam_state: t("Steam login session expired or was opened from an old link. Please start Steam login again."),
        steam_verification_failed: t("Steam could not verify the login response. Please try again from the website.")
      };
      setError(messages[oauthError] || t("Could not finish login. Please try again."));
      return;
    }
    const token = params.get("token");
    if (!token) {
      setError(t("Missing login token from the backend."));
      return;
    }

    completeOAuth(token)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((e) => setError(e?.message || t("Could not finish login. Please try again.")));
  }, [completeOAuth, navigate, params, t]);

  return (
    <AuthShell title="Finishing login" subtitle="Connecting your account to Gotham City.">
      <div className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
        {error ? (
          <div className="flex flex-col items-center gap-3">
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => navigate("/login")} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5">{t("Back to login")}</button>
              <button onClick={() => navigate("/dashboard")} className="rounded-lg bg-[#60519b] px-4 py-2 text-sm font-semibold text-white">{t("Back to dashboard")}</button>
            </div>
          </div>
        ) : (
          <>
            <Loader2 size={26} className="animate-spin text-orange-300" />
            <p className="text-sm text-white/50">{t("Please wait while we verify your login.")}</p>
          </>
        )}
      </div>
    </AuthShell>
  );
}
