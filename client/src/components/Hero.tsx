import { ArrowRight, Copy, PlayCircle, Radio } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useLiveStatus } from "../context/LiveStatusContext";
import { useSite } from "../context/SiteContext";
import { NumberTicker } from "./ui/number-ticker";
import { ShimmerButton } from "./ui/shimmer-button";

export default function Hero() {
  const { content } = useSite();
  const { t, isArabic } = useLanguage();
  const { state: liveState, loading: liveLoading } = useLiveStatus();
  const [copied, setCopied] = useState(false);

  const copyIp = () => {
    navigator.clipboard?.writeText(content.serverIp);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const connect = () => {
    window.location.assign(content.fivemLink && content.fivemLink !== "#" ? content.fivemLink : "/server");
  };
  const configuredHeroImage = content.heroBackgroundImage || "";
  const legacyHeavyHero = /\/(gotham-banner\.gif|gotham-banner-static\.jpg|hero-city\.jpg)$/i.test(configuredHeroImage);
  const heroImage = !configuredHeroImage || (content.performanceMode && legacyHeavyHero)
    ? "/images/hero-city.avif"
    : configuredHeroImage;
  const serverOnline = liveState?.status === "online";
  const serverUnavailable = liveState?.configured === false || liveState?.status === "not_configured";
  const statusLabel = liveLoading
    ? t("Checking")
    : serverUnavailable
      ? t("Unavailable")
      : liveState?.status === "reconnecting"
        ? t("Reconnecting")
      : serverOnline
        ? t("Online")
        : t("Offline");
  const statusTone = serverOnline ? "text-emerald-300" : liveLoading || liveState?.status === "reconnecting" ? "text-amber-200" : "text-rose-300";
  const statusDot = serverOnline ? "bg-emerald-300" : liveLoading || liveState?.status === "reconnecting" ? "bg-amber-200" : "bg-rose-300";

  return (
    <section
      id="home"
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden pb-8 pt-32 sm:pb-12 sm:pt-36"
    >
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img
          src={heroImage}
          alt="Gotham City skyline"
          className="h-full w-full scale-[1.03] object-cover object-center opacity-[.88]"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(115,82,255,.14),transparent_38%),linear-gradient(90deg,#06070b_0%,rgba(6,7,11,.9)_33%,rgba(6,7,11,.3)_72%,rgba(6,7,11,.72)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,7,11,.15),rgba(6,7,11,.28)_52%,#06070b_100%)]" />
      </div>

      <div aria-hidden className="absolute inset-0 -z-[5] bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:linear-gradient(to_bottom,white,transparent_76%)]" />

      <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] xl:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0d14] px-4 py-2 text-xs font-medium text-white/70">
              <span className="relative flex h-2 w-2">
                {serverOnline ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-45" /> : null}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${statusDot}`} />
              </span>
              {liveLoading ? t("Checking server status") : serverOnline ? t("Gotham is online") : t("Server status unavailable")}
            </div>

            <div className="max-w-5xl text-[clamp(3.7rem,8.8vw,8.3rem)] font-semibold leading-[.88] tracking-[-.065em] text-white">
              <h1 className="magic-text hero-title-in block">{t(content.heroTitle1)}</h1>
              <div className="magic-text hero-rise block [--rise-delay:120ms]">
                <span className="site-gradient-text bg-clip-text text-transparent">{t(content.heroTitle2)}</span>
              </div>
            </div>

            <div className="surface-flat hero-rise mt-7 max-w-3xl rounded-[1.75rem] border border-white/10 p-4 [--rise-delay:180ms] sm:p-5">
              <p className="max-w-2xl text-base leading-7 text-white/64 sm:text-lg">
                {t(content.heroDescription)}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ShimmerButton
                  type="button"
                  onClick={connect}
                  borderRadius="14px"
                  background="linear-gradient(135deg, var(--site-primary), var(--site-accent))"
                  shimmerDuration="2.6s"
                  className="gap-2 px-5 py-3 text-sm font-semibold shadow-[0_14px_40px_rgba(99,102,241,.24)]"
                >
                  <PlayCircle size={17} />
                  {t("Connect Now")}
                  <ArrowRight
                    size={15}
                    className={`transition-transform group-hover:translate-x-1 ${isArabic ? "rotate-180 group-hover:-translate-x-1" : ""}`}
                  />
                </ShimmerButton>
                <button
                  type="button"
                  onClick={copyIp}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-white/12 bg-white/[.055] px-5 py-3 text-sm font-medium text-white/75 backdrop-blur transition hover:border-violet-300/35 hover:bg-white/[.09] hover:text-white"
                >
                  <Copy size={15} />
                  {copied ? t("Copied!") : content.serverIp}
                </button>
              </div>
            </div>
          </div>

          {content.heroCardEnabled ? <aside className="surface-flat hero-side-in relative hidden overflow-hidden rounded-[1.75rem] border border-white/10 p-5 lg:block">
            <div className="flex items-center justify-between text-xs text-white/48">
              <span className="flex items-center gap-2"><Radio size={14} className="text-violet-300" /> {t(content.heroCardLabel)}</span>
              <span className={`flex items-center gap-2 ${statusTone}`}><i className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />{statusLabel}</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.025]">
              <picture>
                <source media="(min-width: 1024px)" srcSet={content.heroCardImage || content.logoUrl || "/images/gotham-emblem-static.jpg"} />
                <img
                  src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                  alt="Gotham City emblem"
                  width="512"
                  height="384"
                  className="aspect-[4/3] w-full object-cover opacity-90"
                />
              </picture>
            </div>
            <p className="mt-5 text-sm text-violet-200/75">{t(content.heroCardEyebrow)}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-white">{t(content.heroCardTitle)}</p>
          </aside> : null}
        </div>

        <div className="surface-flat hero-rise mt-8 grid grid-cols-2 gap-2 rounded-[1.75rem] border border-white/[.09] p-2 [--rise-delay:240ms] sm:grid-cols-4">
          {content.stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl px-4 py-4 transition hover:bg-white/[.055] sm:px-5">
              <div className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                <NumberTicker value={stat.value} className="tracking-tight" />
                <span className="text-violet-200">{stat.suffix}</span>
              </div>
                  <p className="mt-1 text-xs text-white/60">{t(stat.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
