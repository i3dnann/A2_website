import { motion } from "framer-motion";
import { ArrowRight, Copy, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSite } from "../context/SiteContext";

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const duration = 1600;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

export default function Hero() {
  const { content } = useSite();
  const [copied, setCopied] = useState(false);
  const copyIp = () => {
    navigator.clipboard?.writeText(content.serverIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden pt-32 pb-20">
      <div className="absolute inset-0 -z-10">
        <img src="/images/hero-city.jpg" alt="Gotham City skyline" className="h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050308]/40 via-[#050308]/70 to-[#050308]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050308] via-transparent to-[#050308]" />
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-fuchsia-200"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Server Online · QBCore Roleplay
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl"
          >
            {content.heroTitle1}
            <span className="block bg-gradient-to-r from-fuchsia-400 via-violet-300 to-amber-300 bg-clip-text text-transparent">
              {content.heroTitle2}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-6 max-w-xl text-base text-white/60 sm:text-lg"
          >
            {content.heroDescription}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href={content.fivemLink || "#"}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(192,38,211,0.4)] transition hover:shadow-[0_0_40px_rgba(192,38,211,0.65)]"
            >
              <PlayCircle size={18} /> Connect Now
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
            <button
              onClick={copyIp}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white/85 backdrop-blur transition hover:border-white/30 hover:bg-white/10"
            >
              <Copy size={16} />
              {copied ? "Copied!" : content.serverIp}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4"
          >
            {content.stats.map((s) => (
              <div key={s.label}>
                <div className="font-serif text-2xl text-white sm:text-3xl">
                  <Counter value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-white/40">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: 4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur"
          >
            <img
              src="/images/cta-street.jpg"
              alt="A2 Studio streets"
              className="h-[520px] w-full rounded-2xl object-cover"
            />
            <div className="absolute inset-2 rounded-2xl bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/10 bg-black/50 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-widest text-fuchsia-300">Now Live</p>
              <p className="mt-1 font-serif text-lg text-white">Season 4: Gotham Nights</p>
            </div>
          </motion.div>
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-fuchsia-600/30 blur-3xl" />
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.8, repeat: Infinity }} className="flex h-9 w-6 items-start justify-center rounded-full border border-white/20 p-1">
          <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
