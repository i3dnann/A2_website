import { motion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import { getIcon } from "../lib/iconMap";
import PageShell from "../components/PageShell";
import { staggerContainer, staggerItem } from "../components/Reveal";

export default function RosterPage() {
  const { content } = useSite();
  return (
    <PageShell subtitle={content.rosterSubtitle} title={content.rosterTitle}>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mx-auto -mt-8 mb-10 max-w-xl text-center text-white/55"
      >
        {content.rosterDesc}
      </motion.p>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {content.roster.map((r) => {
          const Icon = getIcon(r.icon);
          return (
            <motion.div
              key={r.name}
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 transition-colors hover:border-orange-300/30"
            >
              {r.avatar ? (
                <img src={r.avatar} alt={r.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600/30 to-orange-700/30 text-orange-200">
                  <Icon size={24} />
                </div>
              )}
              <div>
                <h3 className="font-serif text-lg text-white">{r.name}</h3>
                <p className="text-sm text-white/50">{r.role}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-orange-300/80">{r.count}</p>
                {r.bio && <p className="mt-2 line-clamp-2 text-xs text-white/45">{r.bio}</p>}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </PageShell>
  );
}
