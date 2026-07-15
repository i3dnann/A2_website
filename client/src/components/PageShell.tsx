import type { ReactNode } from "react";
import { useLanguage } from "../context/LanguageContext";
import { AnimatedGridPattern } from "./ui/animated-grid-pattern";
import { BlurFade } from "./ui/blur-fade";
import { TextAnimate } from "./ui/text-animate";

export default function PageShell({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  const { t } = useLanguage();
  return (
    <section className="relative min-h-screen overflow-hidden pb-24 pt-36">
      <AnimatedGridPattern width={52} height={52} numSquares={20} maxOpacity={0.14} className="absolute inset-x-0 top-0 h-[34rem] w-full fill-violet-300/10 stroke-white/[.045] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_0%,rgba(114,80,240,.2),transparent_62%)]" />
      <div className="relative mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <BlurFade duration={0.7} blur="12px" className="surface-flat rounded-[2rem] border border-white/[.08] px-6 py-10 sm:px-10 sm:py-12">
          {subtitle && <p className="text-sm font-medium text-violet-300">{t(subtitle)}</p>}
          <TextAnimate as="h1" by="word" animation="blurInUp" startOnView={false} once className="magic-text mt-3 max-w-5xl text-4xl font-semibold leading-[.98] tracking-[-.05em] text-white sm:text-6xl lg:text-7xl">{t(title)}</TextAnimate>
          <p className="mt-5 text-sm text-white/38">Gotham City network · live community services</p>
        </BlurFade>
        <BlurFade inView delay={0.12} duration={0.7} className="mt-10">{children}</BlurFade>
      </div>
    </section>
  );
}
