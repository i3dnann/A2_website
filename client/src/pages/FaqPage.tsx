import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useSite } from "../context/SiteContext";
import PageShell from "../components/PageShell";
import { Reveal } from "../components/Reveal";

export default function FaqPage() {
  const { content } = useSite();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <PageShell subtitle={content.faqSubtitle} title={content.faqTitle}>
      <div className="mx-auto mt-6 max-w-3xl">
        <div className="flex flex-col gap-3">
          {content.faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={f.q} delay={i * 0.06}>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-serif text-base text-white sm:text-lg">{f.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-300"
                    >
                      <Plus size={16} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p className="px-6 pb-5 text-sm leading-relaxed text-white/55">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
