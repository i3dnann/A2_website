import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (res.ok) navigate("/dashboard");
    else setError(res.error ?? "Something went wrong.");
  };

  return (
    <AuthShell title="Welcome back, Citizen" subtitle="Sign in to access your Gotham City dashboard.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-orange-400/50 focus:bg-white/[0.07]"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium uppercase tracking-wider text-white/50">
              Password
            </label>
            <a href="#" className="text-xs text-orange-300 hover:text-orange-200">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-orange-400/50 focus:bg-white/[0.07]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group relative mt-2 inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 to-orange-400 py-3.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(96,81,155,0.35)] transition hover:shadow-[0_0_35px_rgba(96,81,155,0.55)] disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <div className="relative my-2 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-widest text-white/30">Or continue with</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SocialButton label="Discord" color="from-[#5865F2]/20 to-[#5865F2]/5" border="border-[#5865F2]/30">
            <path d="M20.317 4.369A19.79 19.79 0 0016.558 3c-.21.375-.444.874-.608 1.267a18.27 18.27 0 00-5.898 0A12.696 12.696 0 009.44 3a19.736 19.736 0 00-3.76 1.37C2.36 9.06 1.57 13.62 1.965 18.115a19.9 19.9 0 006.058 3.058c.49-.665.926-1.372 1.3-2.115a12.9 12.9 0 01-2.048-.98c.172-.126.34-.257.5-.392a14.09 14.09 0 0012.06 0c.163.135.331.266.5.392-.65.386-1.336.71-2.05.981.375.743.81 1.45 1.3 2.114a19.86 19.86 0 006.062-3.057c.5-5.177-.838-9.693-3.53-13.746zM8.68 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.947 2.419-2.157 2.419zm6.64 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.946 2.419-2.157 2.419z" />
          </SocialButton>
          <SocialButton label="Steam" color="from-white/15 to-white/5" border="border-white/20">
            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.393 3.393 0 011.943-.6c.062 0 .124.002.185.005l2.86-4.142v-.06c0-2.505 2.036-4.542 4.542-4.542 2.505 0 4.541 2.037 4.541 4.542 0 2.506-2.036 4.543-4.541 4.543h-.105l-4.076 2.91c0 .046.003.092.003.139 0 1.913-1.556 3.469-3.47 3.469-1.678 0-3.078-1.194-3.399-2.775L.436 15.63C1.79 20.436 6.474 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zM7.54 18.21l-1.473-.609a2.593 2.593 0 004.796-.239l-3.323.848zm9.913-11.535a3.03 3.03 0 10.001 6.062 3.03 3.03 0 00-.001-6.062zm-.001 5.033a2.002 2.002 0 110-4.004 2.002 2.002 0 010 4.004z" />
          </SocialButton>
        </div>
      </form>

      <p className="mt-8 text-center text-sm text-white/50">
        Don't have an account?{" "}
        <Link to="/register" className="font-medium text-orange-300 hover:text-orange-200">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

function SocialButton({
  children,
  label,
  color,
  border,
}: {
  children: React.ReactNode;
  label: string;
  color: string;
  border: string;
}) {
  return (
    <button
      type="button"
      className={`flex items-center justify-center gap-2 rounded-xl border ${border} bg-gradient-to-b ${color} py-3 text-sm font-medium text-white/85 transition hover:brightness-125`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        {children}
      </svg>
      {label}
    </button>
  );
}
