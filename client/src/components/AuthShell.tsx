import { ArrowUpRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { useSite } from "../context/SiteContext";
import AvatarCircles from "./AvatarCircles";
import { AnimatedGridPattern } from "./ui/animated-grid-pattern";
import { BlurFade } from "./ui/blur-fade";
import { BorderBeam } from "./ui/border-beam";
import { TextAnimate } from "./ui/text-animate";

const PERKS = [
  { icon: ShieldCheck, text: "Secure account with linked Discord & Steam" },
  { icon: Users, text: "Join a community built for memorable roleplay stories" },
  { icon: Sparkles, text: "Access your dashboard, characters & tickets" },
];

export default function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  const { content } = useSite();
  const { t } = useLanguage();
  const [avatars, setAvatars] = useState<string[]>([]);

  useEffect(() => {
    api<{ avatars: string[] }>("/api/public/community-avatars")
      .then((result) => setAvatars(result.avatars || []))
      .catch(() => setAvatars([]));
  }, []);

  const logo = content.logoUrl === "/assets/gotham-logo.png" ? "/assets/gotham-logo-512.webp" : content.logoUrl || "/images/gotham-emblem-static.jpg";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-14 pt-28 sm:px-6">
      <AnimatedGridPattern width={52} height={52} numSquares={18} maxOpacity={0.13} className="absolute inset-0 h-full w-full fill-violet-300/10 stroke-white/[.045] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(124,92,255,.16),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(59,130,246,.1),transparent_36%)]" />

      <BlurFade duration={0.8} blur="14px" className="relative grid w-full max-w-[78rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b12]/82 shadow-[0_35px_120px_rgba(0,0,0,.6)] backdrop-blur-2xl lg:min-h-[670px] lg:grid-cols-[1.08fr_.92fr]">
        <BorderBeam duration={11} size={170} colorFrom="var(--site-primary)" colorTo="var(--site-accent)" />

        <section className="relative hidden min-h-[670px] overflow-hidden lg:block">
          <img src="/images/hero-city.jpg" alt="Gotham City at night" className="absolute inset-0 h-full w-full object-cover opacity-66" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,7,11,.18),rgba(6,7,11,.45)_60%,#090b12),linear-gradient(0deg,rgba(6,7,11,.92),transparent_62%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
            <Link to="/" className="group flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-2 pr-4 backdrop-blur-xl">
              <img src={logo} alt={content.siteName} className="h-11 w-11 rounded-xl object-cover" />
              <span className="text-base font-semibold tracking-tight text-white">{t(content.siteName)}</span>
              <ArrowUpRight size={15} className="ml-1 text-white/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-200" />
            </Link>

            <div className="max-w-xl">
              <p className="text-sm font-medium text-violet-200">{t("Secure city access")}</p>
              <TextAnimate as="h2" by="word" animation="blurInUp" startOnView={false} once className="magic-text mt-3 text-5xl font-semibold leading-[.95] tracking-[-.05em] text-white xl:text-6xl">{t("Your story in Gotham awaits.")}</TextAnimate>
              <div className="mt-8 grid gap-2">
                {PERKS.map((perk) => (
                  <div key={perk.text} className="flex items-center gap-3 rounded-2xl border border-white/[.08] bg-black/25 px-4 py-3.5 backdrop-blur-lg">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-200"><perk.icon size={16} /></span>
                    <span className="text-sm text-white/64">{t(perk.text)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <AvatarCircles avatars={avatars} />
              <p className="max-w-xs text-xs leading-5 text-white/42">{t("Real players. Shared stories. One city.")}</p>
            </div>
          </div>
        </section>

        <section className="relative flex flex-col justify-center border-white/10 bg-[#0a0c13]/92 p-7 sm:p-11 lg:border-l xl:p-14">
          <Link to="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <img src={logo} alt={content.siteName} className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-lg font-semibold tracking-tight text-white">{t(content.siteName)}</span>
          </Link>
          <p className="text-sm font-medium text-violet-300">{t("Identity portal")}</p>
          <TextAnimate as="h1" by="word" animation="blurInUp" startOnView={false} once className="magic-text mt-3 text-4xl font-semibold leading-[.98] tracking-[-.045em] text-white sm:text-5xl">{t(title)}</TextAnimate>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/48">{t(subtitle)}</p>
          <div className="mt-6 flex items-center gap-3 lg:hidden"><AvatarCircles avatars={avatars} /><span className="text-xs text-white/38">{t("Real players. Shared stories. One city.")}</span></div>
          <div className="mt-8 border-t border-white/[.08] pt-7">{children}</div>
        </section>
      </BlurFade>
    </div>
  );
}
