import { motion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import PageShell from "../components/PageShell";

export default function JourneyPage() {
  const { content } = useSite();
  return (
    <PageShell subtitle={content.journeySubtitle} title={content.journeyTitle}>
      <div className="relative mx-auto mt-6 max-w-3xl">
        <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-fuchsia-500/60 via-white/10 to-transparent sm:left-1/2" />
        {content.journey.map((j, i) => {
          const isEven = i % 2 === 0;
          return (
            <motion.div
              key={j.year}
              initial={{ opacity: 0, x: isEven ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`relative mb-10 flex items-start gap-6 sm:mb-14 sm:w-1/2 ${isEven ? "sm:pr-10" : "sm:ml-auto sm:pl-10"}`}
            >
              <span className="absolute -left-[3px] top-1.5 h-3 w-3 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.8)] sm:left-auto sm:right-[-3px] sm:top-1.5" />
              <div className="ml-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:ml-0">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300">{j.year}</span>
                <h3 className="mt-2 font-serif text-xl text-white">{j.title}</h3>
                <p className="mt-2 text-sm text-white/55">{j.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Famous Characters section */}
      <div className="mt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-400">
            {content.famousSubtitle}
          </p>
          <h2 className="mt-3 font-serif text-3xl text-white sm:text-4xl">{content.famousTitle}</h2>
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
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                {c.tag}
              </span>
              <h3 className="mt-4 font-serif text-lg text-white">{c.name}</h3>
              <p className="mt-1 text-sm text-white/50">{c.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
