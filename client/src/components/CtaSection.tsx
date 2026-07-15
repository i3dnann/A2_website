import { useNavigate } from "react-router-dom";
import { ArrowRight, LifeBuoy, MessageCircle } from "lucide-react";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import { Reveal } from "./Reveal";
import { BorderBeam } from "./ui/border-beam";
import { ShimmerButton } from "./ui/shimmer-button";
import { TextAnimate } from "./ui/text-animate";

export default function CtaSection() {
  const { content } = useSite();
  const { t, isArabic } = useLanguage();
  const navigate = useNavigate();
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,.32)]">
            <BorderBeam duration={11} size={150} colorFrom="var(--site-primary)" colorTo="var(--site-accent)" />
            <img src={content.ctaBackgroundImage || "/images/cta-street.jpg"} alt="Join Gotham City" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#050608_0%,rgba(5,6,8,.84)_44%,rgba(5,6,8,.42)_100%)]" />
            <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-violet-500/15 blur-2xl" />
            <div className="relative grid gap-10 px-6 py-20 sm:px-12 lg:grid-cols-[1fr_auto] lg:items-end lg:px-16">
              <div><div className="mb-5 flex items-center gap-2 text-xs font-medium text-violet-200"><LifeBuoy size={14} /> {t("Need Support? Open a Ticket")}</div><TextAnimate as="h2" by="word" animation="blurInUp" once className="magic-text max-w-4xl text-4xl font-semibold leading-[.95] tracking-[-.045em] text-white sm:text-6xl">{t(content.ctaTitle)}</TextAnimate><p className="mt-6 max-w-xl text-lg text-white/60">{t(content.ctaDesc)}</p></div>
              <div className="flex flex-wrap gap-3">
                <ShimmerButton type="button" onClick={() => navigate("/register")} borderRadius="14px" background="linear-gradient(135deg, var(--site-primary), var(--site-accent))" className="gap-2 px-6 py-3.5 text-sm font-semibold">{t("Create Account")} <ArrowRight size={16} className={`transition-transform ${isArabic ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} /></ShimmerButton>
                <a href={content.discordLink || "/"} target={content.discordLink && content.discordLink !== "#" ? "_blank" : undefined} rel="noreferrer" className="inline-flex items-center gap-2 rounded-[14px] border border-white/15 bg-black/35 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-violet-300/35"><MessageCircle size={16} /> {t("Join Discord")}</a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
