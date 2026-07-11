import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

const RIPPLE_COUNT = 4;

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
  const ripples = useMemo(() => {
    const count = lightweight ? 2 : RIPPLE_COUNT;
    return Array.from({ length: count }).map((_, index) => ({
      id: index,
      size: 34 + index * 20,
      delay: index * 1.4,
      opacity: Math.max(0.04, 0.14 - index * 0.02),
      duration: 16,
    }));
  }, [lightweight]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(96,81,155,0.16),transparent_36rem)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.2),rgba(8,8,8,0.9))]" />

      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 82% 62% at 50% 38%, black 30%, transparent 100%)",
        }}
      />

      <div className="absolute left-1/2 top-[44%] h-[128vmax] w-[128vmax] -translate-x-1/2 -translate-y-1/2">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className={`site-ripple-ring ${staticMode ? "site-ripple-ring-static" : ""}`}
            style={{
              "--ripple-size": `${ripple.size}vmax`,
              "--ripple-delay": `${ripple.delay}s`,
              "--ripple-duration": `${ripple.duration}s`,
              "--ripple-opacity": ripple.opacity,
            } as CSSProperties}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,1,6,0.4)_60%,rgba(2,1,6,0.9)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#080808] to-transparent" />
    </div>
  );
}
