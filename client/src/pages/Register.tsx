import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, Loader2, Check } from "lucide-react";
import AuthShell from "../components/AuthShell";
import ShimmerButton from "../components/magicui/ShimmerButton";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { launchLoginFireworks } from "../utils/loginFireworks";

export default function Register() {
  const { register, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!agree) {
      setError("You must agree to the community rules and terms.");
      return;
    }
    const res = await register(username, email, password);
    if (res.ok) {
      launchLoginFireworks();
      window.setTimeout(() => navigate("/dashboard"), 650);
    }
    else setError(res.error ?? "Something went wrong.");
  };

  return (
    <AuthShell title="Create your account" subtitle="Join Gotham City and step into the city.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            {t("Username")}
          </label>
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="JohnDoe"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-300/45 focus:bg-white/[0.07]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            {t("Email Address")}
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-300/45 focus:bg-white/[0.07]"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              {t("Password")}
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-9 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-300/45 focus:bg-white/[0.07]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={t(showPassword ? "Hide passwords" : "Show passwords")}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              {t("Confirm")}
            </label>
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-violet-300/45 focus:bg-white/[0.07]"
              />
            </div>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs text-white/50">
          <button
            type="button"
            onClick={() => setAgree((a) => !a)}
            aria-label={t("Agree to community rules and terms")}
            aria-pressed={agree}
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
              agree ? "border-violet-300 bg-violet-500" : "border-white/20 bg-white/5"
            }`}
          >
            {agree && <Check size={11} className="text-white" />}
          </button>
          {t("I agree to the Gotham City community rules, terms of service, and privacy policy.")}
        </label>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
          >
            {error}
          </motion.p>
        )}

        <ShimmerButton
          type="submit"
          disabled={loading}
          borderRadius="14px"
          background="linear-gradient(135deg, var(--site-primary), var(--site-accent))"
          className="mt-1 gap-2 py-3.5 text-sm font-semibold"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {t("Creating account...")}
            </>
          ) : (
            t("Create Account")
          )}
        </ShimmerButton>
      </form>

      <p className="mt-8 text-center text-sm text-white/50">
        {t("Already have an account?")}{" "}
        <Link to="/login" className="font-medium text-violet-300 hover:text-violet-200">
          {t("Sign in")}
        </Link>
      </p>
    </AuthShell>
  );
}
