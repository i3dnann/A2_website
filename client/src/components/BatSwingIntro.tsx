import { motion, useReducedMotion } from "framer-motion";

type BatSwingIntroProps = {
  replayKey: string;
  delay?: number;
};

export default function BatSwingIntro({ replayKey, delay = 0 }: BatSwingIntroProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return null;
  }

  return (
    <motion.div
      key={replayKey}
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: delay + 2.2, duration: 0.55, ease: "easeOut" }}
    >
      <motion.div
        className="absolute top-[13vh] h-[120px] w-[340px] sm:h-[165px] sm:w-[470px] lg:h-[215px] lg:w-[630px]"
        initial={{
          x: "118vw",
          y: 18,
          rotate: -12,
          scale: 0.62,
          filter: "blur(9px)",
          opacity: 0,
        }}
        animate={{
          x: ["118vw", "62vw", "16vw", "-46vw"],
          y: [18, -28, 18, -10],
          rotate: [-12, 10, -7, 8],
          scale: [0.62, 1.05, 0.92, 0.7],
          filter: ["blur(9px)", "blur(1px)", "blur(3px)", "blur(12px)"],
          opacity: [0, 0.95, 0.78, 0],
        }}
        transition={{ delay, duration: 2.65, ease: [0.18, 0.82, 0.24, 1] }}
      >
        <div className="absolute inset-0 translate-x-10 scale-110 bg-[#60519b]/55 blur-2xl [mask-image:url('/images/bat-swing.png')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#43376f] via-[#8a7ac4] to-[#dfd9f5] drop-shadow-[0_0_42px_rgba(96,81,155,0.95)] [mask-image:url('/images/bat-swing.png')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
          animate={{
            skewX: [-4, 5, -3, 2],
            scaleY: [0.92, 1.08, 0.96, 1],
          }}
          transition={{ duration: 1.15, repeat: 2, ease: "easeInOut" }}
        />
        <img
          src="/images/bat-swing.png"
          alt=""
          className="absolute inset-0 h-full w-full object-contain opacity-45 mix-blend-screen brightness-150 contrast-125 drop-shadow-[0_0_28px_rgba(201,192,234,0.75)]"
        />
        <div className="absolute inset-x-4 top-1/2 h-6 -translate-y-1/2 bg-[#dfd9f5]/45 blur-3xl" />
      </motion.div>
    </motion.div>
  );
}
