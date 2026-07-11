import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import FamousCharacterCard from "./FamousCharacterCard";
import RoadmapTimeline from "./RoadmapTimeline";
import { Reveal } from "./Reveal";

export default function Journey() {
  const { content } = useSite();
  const { t } = useLanguage();
  return (
    <section id="journey" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{t(content.journeySubtitle)}</p>
          <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{t(content.journeyTitle)}</h2>
        </Reveal>
        <RoadmapTimeline items={content.journey} />

        {content.famousCharacters.length > 0 && (
          <>
            <Reveal className="mx-auto mt-24 max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{t(content.famousSubtitle)}</p>
              <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{t(content.famousTitle)}</h2>
            </Reveal>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {content.famousCharacters.map((c, i) => (
                <FamousCharacterCard key={c.name} character={c} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
