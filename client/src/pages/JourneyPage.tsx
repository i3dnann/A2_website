import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import PageShell from "../components/PageShell";
import RoadmapTimeline from "../components/RoadmapTimeline";

export default function JourneyPage() {
  const { content } = useSite();
  const { t } = useLanguage();
  return (
    <PageShell subtitle={content.journeySubtitle} title={content.journeyTitle}>
      <RoadmapTimeline items={content.journey} />

      {/* Famous Characters section */}
      <div className="mt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
            {t(content.famousSubtitle)}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-white sm:text-4xl">{t(content.famousTitle)}</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.famousCharacters.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6"
            >
              {c.image && <img src={c.image} alt={c.name} loading="lazy" className="-mx-2 -mt-2 mb-4 h-36 w-[calc(100%+1rem)] rounded-xl object-cover" />}
              <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200">
                {t(c.tag)}
              </span>
              <h3 className="mt-4 font-serif text-lg text-white">{t(c.name)}</h3>
              <p className="mt-1 text-sm text-white/50">{t(c.title)}</p>
              {c.bio && <p className="mt-3 line-clamp-3 text-xs text-white/40">{t(c.bio)}</p>}
              {c.link && (
                <a href={externalUrl(c.link)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-[#8a7ac4]/50 hover:text-white">
                  <ExternalLink size={13} /> {t("Open profile")}
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function externalUrl(value?: string) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}
