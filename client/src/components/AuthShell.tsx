import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ShieldCheck, Sparkles, Users } from "lucide-react";
import { useSite } from "../context/SiteContext";

const PERKS = [
  { icon: ShieldCheck, text: "Secure account with linked Discord & Steam" },
  { icon: Users, text: "Join 15,000+ active roleplay community members" },
  { icon: Sparkles, text: "Access your dashboard, characters & tickets" },
];

export default function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  const { content } = useSite();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_0_80px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:grid-cols-2">
        {/* Branding side */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex"
        >
          <img
            src="/images/gotham-banner.gif"
            alt={content.siteName}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/70 via-black/80 to-red-950/80" />
          <motion.div
            className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-orange-600/30 blur-3xl"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />

          <Link to="/" className="relative z-10 flex items-center gap-3">
            <img src="/images/gotham-emblem.gif" alt={content.siteName} className="h-10 w-10 rounded-full object-cover ring-1 ring-orange-400/30" />
            <span className="font-serif text-lg tracking-[0.25em] text-white">
              {content.siteName}
            </span>
          </Link>

          <div className="relative z-10">
            <h2 className="font-serif text-3xl leading-snug text-white">
              Your story in
              <span className="block bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                Gotham City awaits.
              </span>
            </h2>
            <div className="mt-8 flex flex-col gap-4">
              {PERKS.map((p) => (
                <div key={p.text} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-orange-300">
                    <p.icon size={16} />
                  </span>
                  {p.text}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Form side */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col justify-center bg-[#0a0a0a]/85 p-8 sm:p-12"
        >
          <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/images/gotham-emblem.gif" alt={content.siteName} className="h-9 w-9 rounded-full object-cover ring-1 ring-orange-400/30" />
            <span className="font-serif text-lg tracking-[0.25em] text-white">
                {content.siteName}
            </span>
          </Link>
          <h1 className="font-serif text-2xl text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-white/50">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
