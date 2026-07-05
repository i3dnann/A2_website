import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function AnimatedBackground() {
  const reducedMotion = useReducedMotion();
  const [lightweight, setLightweight] = useState(false);

  useEffect(() => {
    const update = () => setLightweight(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  const staticMode = lightweight || reducedMotion;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080808]">
      {/* base grid */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(96,81,155,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(96,81,155,0.25) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 100%)",
        }}
      />

      {!staticMode && (
        <>
          <motion.div
            className="absolute -top-40 -left-40 h-[38rem] w-[38rem] rounded-full bg-orange-700/18 blur-[96px]"
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/3 -right-40 h-[34rem] w-[34rem] rounded-full bg-orange-700/18 blur-[96px]"
            animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      {/* floating particles */}
      {!staticMode && Array.from({ length: 14 }).map((_, i) => {
        const size = 2 + ((i * 7) % 4);
        const left = (i * 37) % 100;
        const delay = (i % 10) * 0.7;
        const duration = 10 + (i % 8) * 2.2;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-orange-300/40"
            style={{ width: size, height: size, left: `${left}%`, bottom: "-5%" }}
            animate={{ y: ["0%", "-120vh"], opacity: [0, 0.8, 0] }}
            transition={{ duration, repeat: Infinity, delay, ease: "linear" }}
          />
        );
      })}

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,1,6,0.4)_60%,rgba(2,1,6,0.9)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#080808] to-transparent" />
    </div>
  );
}
