import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/**
 * Animated horizontal vital bar (Health / Armor) with glow, shimmer,
 * low-value pulse warning, and count-up numbers.
 */
export function VitalBar({
  icon: Icon,
  label,
  value,
  max = 100,
  tone = "red",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  max?: number;
  tone?: "red" | "blue";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const displayVal = useCountUp(value);
  const low = pct <= 30;

  const gradient =
    tone === "red"
      ? "from-rose-500 via-red-500 to-orange-400"
      : "from-sky-400 via-blue-500 to-indigo-500";
  const iconColor = tone === "red" ? "text-rose-300" : "text-sky-300";
  const ringColor = tone === "red" ? "shadow-rose-500/40" : "shadow-sky-500/40";

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            animate={low ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 1, repeat: low ? Infinity : 0 }}
            className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 ${iconColor} shadow-lg ${ringColor}`}
          >
            <Icon size={14} />
          </motion.span>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/60">{label}</span>
        </div>
        <motion.span
          key={displayVal}
          initial={{ opacity: 0.4, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-serif text-sm font-semibold ${low ? "text-rose-300" : "text-white"}`}
        >
          {displayVal}
          <span className="text-white/30">/{max}</span>
        </motion.span>
      </div>

      <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-black/40">
        <motion.div
          className={`relative h-full rounded-full bg-gradient-to-r ${gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* shimmer sweep */}
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ width: "40%" }}
            animate={{ x: ["-100%", "250%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
          />
        </motion.div>
        {low && (
          <motion.div
            className="absolute inset-0 rounded-full bg-red-500/30"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Circular radial vital ring — used on compact character cards.
 */
export function VitalRing({
  icon: Icon,
  value,
  max = 100,
  tone = "red",
  size = 56,
}: {
  icon: LucideIcon;
  value: number;
  max?: number;
  tone?: "red" | "blue";
  size?: number;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const displayVal = useCountUp(value);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const stroke = tone === "red" ? "#fb7185" : "#38bdf8";
  const trackColor = "rgba(255,255,255,0.08)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={5} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 4px ${stroke})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <Icon size={12} className={tone === "red" ? "text-rose-300" : "text-sky-300"} />
        <span className="mt-0.5 text-[11px] font-bold text-white">{displayVal}</span>
      </div>
    </div>
  );
}
