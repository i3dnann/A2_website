import { motion } from "framer-motion";
import { useSite } from "../context/SiteContext";
import { Reveal } from "./Reveal";

export default function Journey() {
  const { content } = useSite();
  return (
    <section id="journey" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{content.journeySubtitle}</p>
          <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{content.journeyTitle}</h2>
        </Reveal>
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-orange-500/60 via-white/10 to-transparent sm:left-1/2" />
          {content.journey.map((j, i) => {
            const isEven = i % 2 === 0;
            return (
              <motion.div key={j.year} initial={{ opacity: 0, x: isEven ? -40 : 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`relative mb-10 flex items-start gap-6 sm:mb-14 sm:w-1/2 ${isEven ? "sm:pr-10" : "sm:ml-auto sm:pl-10"}`}>
                <span className="absolute -left-[3px] top-1.5 h-3 w-3 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(96,81,155,0.8)] sm:left-auto sm:right-[-3px] sm:top-1.5" />
                <div className="ml-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:ml-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-300">{j.year}</span>
                  <h3 className="mt-2 font-serif text-xl text-white">{j.title}</h3>
                  <p className="mt-2 text-sm text-white/55">{j.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <Reveal className="mx-auto mt-24 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{content.famousSubtitle}</p>
          <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{content.famousTitle}</h2>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.famousCharacters.map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: i * 0.08 }} whileHover={{ y: -6 }} className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6">
              {c.image && <img src={c.image} alt={c.name} loading="lazy" className="-mx-2 -mt-2 mb-4 h-36 w-[calc(100%+1rem)] rounded-xl object-cover" />}
              <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200">{c.tag}</span>
              <h3 className="mt-4 font-serif text-lg text-white">{c.name}</h3>
              <p className="mt-1 text-sm text-white/50">{c.title}</p>
              {c.bio && <p className="mt-3 line-clamp-3 text-xs text-white/40">{c.bio}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
