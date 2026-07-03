import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { Reveal } from "./Reveal";

export default function Faq() {
  const { content } = useSite();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{content.faqSubtitle}</p>
          <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{content.faqTitle}</h2>
        </Reveal>
        <div className="mt-14 flex flex-col gap-3">
          {content.faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={f.q} delay={i * 0.06}>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <button onClick={() => setOpenIndex(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                    <span className="font-serif text-base text-white sm:text-lg">{f.q}</span>
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-300"><Plus size={16} /></motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
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
    </section>
  );
}
