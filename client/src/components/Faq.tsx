import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { Reveal } from "./Reveal";
import { TextAnimate } from "./ui/text-animate";

export default function Faq() {
  const { content } = useSite();
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-medium text-violet-300">{t(content.faqSubtitle)}</p>
          <TextAnimate as="h2" by="word" animation="blurInUp" once className="magic-text mt-3 text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-white sm:text-6xl">{t(content.faqTitle)}</TextAnimate>
        </Reveal>
        <div className="mt-14 ml-auto flex max-w-4xl flex-col gap-2">
          {content.faqs.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={f.q} delay={i * 0.06}>
                <div className="surface-flat overflow-hidden rounded-[1.4rem] border border-white/[.08]">
                  <button onClick={() => setOpenIndex(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                    <span className="text-lg font-semibold tracking-tight text-white sm:text-xl">{t(f.q)}</span>
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-400/10 text-violet-200"><Plus size={16} /></motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                        <p className="px-6 pb-5 text-sm leading-relaxed text-white/55">{t(f.a)}</p>
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
