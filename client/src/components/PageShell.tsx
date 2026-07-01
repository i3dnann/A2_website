import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function PageShell({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="relative min-h-screen pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-400">
            {subtitle}
          </p>
          <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        </div>
        <div className="mt-14">{children}</div>
      </motion.div>
    </section>
  );
}
