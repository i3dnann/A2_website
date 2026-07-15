import type { ReactNode } from "react";
import { useLanguage } from "../context/LanguageContext";
import { AnimatedGridPattern } from "./ui/animated-grid-pattern";
import { BlurFade } from "./ui/blur-fade";
import { TextAnimate } from "./ui/text-animate";

export default function PageShell({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  const { t } = useLanguage();
  return (
    <section className="relative min-h-screen overflow-hidden pb-24 pt-28 sm:pt-32">
      <AnimatedGridPattern width={52} height={52} numSquares={20} maxOpacity={0.1} className="absolute inset-x-0 top-0 h-[28rem] w-full fill-violet-300/[.07] stroke-white/[.035] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_38%_0%,rgba(114,80,240,.13),transparent_56%)]" />
      <div className="relative mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <BlurFade duration={0.7} blur="12px" className="relative max-w-5xl py-8 sm:py-10 lg:py-12">
          {subtitle && (
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--site-accent)]" />
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300">{t(subtitle)}</p>
            </div>
          )}
          <TextAnimate as="h1" by="word" animation="blurInUp" startOnView={false} once className="magic-text mt-4 max-w-5xl text-4xl font-semibold leading-[.96] tracking-[-.05em] text-white sm:text-6xl lg:text-7xl">{t(title)}</TextAnimate>
          <p className="mt-5 text-sm text-white/38">Gotham City network · live community services</p>
          <div className="mt-8 h-px w-full max-w-3xl bg-gradient-to-r from-white/15 via-white/[.06] to-transparent" />
        </BlurFade>
        <BlurFade inView delay={0.12} duration={0.7} className="mt-4 sm:mt-6">{children}</BlurFade>
      </div>
    </section>
  );
}
