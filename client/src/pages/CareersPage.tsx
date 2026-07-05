import { motion } from "framer-motion";
import { ArrowRight, Briefcase } from "lucide-react";
import { useSite } from "../context/SiteContext";
import PageShell from "../components/PageShell";
import { staggerContainer, staggerItem } from "../components/Reveal";

export default function CareersPage() {
  const { content } = useSite();
  return (
    <PageShell subtitle={content.careersSubtitle} title={content.careersTitle}>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <p className="max-w-sm text-white/55">{content.careersDesc}</p>
          <a
            href="#positions"
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-orange-400/40 hover:bg-white/10"
          >
            View Careers Portal <ArrowRight size={16} />
          </a>
        </motion.div>
        <motion.div id="positions" variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
          {content.careers.map((c) => (
            <motion.div
              key={c.role}
              variants={staggerItem}
              whileHover={{ x: 6 }}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition-colors hover:border-orange-300/30"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
                  <Briefcase size={20} />
                </div>
                <div>
                  <p className="font-serif text-base text-white">{c.role}</p>
                  <p className="text-xs uppercase tracking-wider text-white/40">{c.dept}</p>
                </div>
              </div>
              <span className="whitespace-nowrap rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200">
                {c.type}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </PageShell>
  );
}
