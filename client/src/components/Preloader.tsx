import { AnimatePresence, motion } from "framer-motion";

export default function Preloader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050308]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_60%)]" />

          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 shadow-[0_0_60px_rgba(168,85,247,0.35)]"
          >
            <motion.img
              src="/images/logo-emblem.png"
              alt="A2 Studio"
              className="h-16 w-16 object-contain"
              animate={{ filter: ["drop-shadow(0 0 6px rgba(217,70,239,0.4))", "drop-shadow(0 0 18px rgba(217,70,239,0.9))", "drop-shadow(0 0 6px rgba(217,70,239,0.4))"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 font-serif text-2xl tracking-[0.35em] text-white/90"
          >
            A2 <span className="text-fuchsia-400">STUDIO</span>
          </motion.h1>

          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 h-[2px] overflow-hidden rounded-full bg-white/10"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-fuchsia-500 via-violet-400 to-amber-300"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-4 text-xs uppercase tracking-[0.4em] text-white/40"
          >
            Entering Gotham City
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
