import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useLanguage } from "../context/LanguageContext";
import AnimatedGridPattern from "./magicui/AnimatedGridPattern";

export default function PageShell({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  const { t } = useLanguage();
  return (
    <section className="relative min-h-screen overflow-hidden pt-32 pb-20">
      <AnimatedGridPattern className="opacity-45" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_50%_0%,rgba(96,81,155,.24),transparent_62%)]" />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="relative mx-auto max-w-3xl text-center">
          {subtitle && (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              {t(subtitle)}
            </p>
          )}
          <h1 className={`${subtitle ? "mt-3" : ""} font-serif text-4xl text-white sm:text-5xl lg:text-6xl`}>
            {t(title)}
          </h1>
        </div>
        <div className="mt-14">{children}</div>
      </motion.div>
    </section>
  );
}
