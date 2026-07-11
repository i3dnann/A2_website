import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function PointerHighlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <span className={`pointer-highlight relative inline-flex items-center px-1.5 py-0.5 ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-lg border border-[#8a7ac4]/45 bg-[#60519b]/12 shadow-[0_0_24px_rgba(96,81,155,0.22)]"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
        whileInView={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45 }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute -right-2 -top-2 h-3 w-3 rounded-full border border-white/70 bg-[#c7b8ff] shadow-[0_0_18px_rgba(199,184,255,0.8)]"
        animate={reducedMotion ? undefined : { x: [0, 3, 0], y: [0, -3, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}
