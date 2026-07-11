import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function BatSwingIntro({ delay = 0 }: { delay?: number }) {
  const reducedMotion = useReducedMotion();
  const [mobile, setMobile] = useState(false);
  const [played] = useState(() => sessionStorage.getItem("a2_intro_played") === "1");

  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!played) sessionStorage.setItem("a2_intro_played", "1");
  }, [played]);

  if (reducedMotion || mobile || played) {
    return null;
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: delay + 2.2, duration: 0.55, ease: "easeOut" }}
    >
      <motion.div
        className="absolute top-[13vh] h-[165px] w-[470px] lg:h-[215px] lg:w-[630px] will-change-transform"
        initial={{
          x: "118vw",
          y: 18,
          rotate: -12,
          scale: 0.62,
          opacity: 0,
        }}
        animate={{
          x: ["118vw", "62vw", "16vw", "-46vw"],
          y: [18, -28, 18, -10],
          rotate: [-12, 10, -7, 8],
          scale: [0.62, 1.05, 0.92, 0.7],
          opacity: [0, 0.95, 0.78, 0],
        }}
        transition={{ delay, duration: 2.65, ease: [0.18, 0.82, 0.24, 1] }}
      >
        <div className="absolute inset-0 translate-x-10 scale-110 bg-[#60519b]/45 [mask-image:url('/images/bat-swing.png')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#43376f] via-[#8a7ac4] to-[#dfd9f5] [mask-image:url('/images/bat-swing.png')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
          animate={{
            skewX: [-4, 5, -3, 2],
            scaleY: [0.92, 1.08, 0.96, 1],
          }}
          transition={{ duration: 1.15, repeat: 2, ease: "easeInOut" }}
        />
        <img
          src="/images/bat-swing.png"
          alt=""
          className="absolute inset-0 h-full w-full object-contain opacity-45 mix-blend-screen brightness-150 contrast-125"
        />
      </motion.div>
    </motion.div>
  );
}
