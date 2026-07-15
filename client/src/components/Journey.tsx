import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import FamousCharacterCard from "./FamousCharacterCard";
import RoadmapTimeline from "./RoadmapTimeline";
import { Reveal } from "./Reveal";
import { TextAnimate } from "./ui/text-animate";

export default function Journey() {
  const { content } = useSite();
  const { t } = useLanguage();
  return (
    <section id="journey" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <Reveal className="max-w-3xl">
          <p className="text-sm font-medium text-violet-300">{t(content.journeySubtitle)}</p>
          <TextAnimate as="h2" by="word" animation="blurInUp" once className="magic-text mt-3 text-4xl font-semibold leading-[1.02] tracking-[-.045em] text-white sm:text-6xl">{t(content.journeyTitle)}</TextAnimate>
        </Reveal>
        <RoadmapTimeline items={content.journey} />

        {content.famousCharacters.length > 0 && (
          <>
            <Reveal className="mx-auto mt-24 max-w-2xl text-center">
              <p className="text-sm font-medium text-violet-300">{t(content.famousSubtitle)}</p>
              <TextAnimate as="h2" by="word" animation="blurInUp" once className="magic-text mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{t(content.famousTitle)}</TextAnimate>
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
