import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import FamousCharacterCard from "../components/FamousCharacterCard";
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
            <FamousCharacterCard key={c.name} character={c} index={i} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
