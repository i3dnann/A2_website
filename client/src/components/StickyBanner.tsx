import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";

export default function StickyBanner() {
  const { content } = useSite();
  const { t, isArabic } = useLanguage();
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [dismissed, setDismissed] = useState(false);

  const enabled = Boolean(content.stickyBannerEnabled);
  const text = content.stickyBannerText || "";
  const href = content.stickyBannerLink || "";
  const label = content.stickyBannerButton || "Open";
  const top = useTransform(scrollY, [0, 120], [82, 14]);
  const opacity = useTransform(scrollY, [0, 60], [1, 0.96]);
  const isExternal = /^https?:\/\//i.test(href);

  const body = useMemo(() => (
    <>
      <span className="line-clamp-1 min-w-0 text-sm font-semibold text-white/90">{t(text)}</span>
      {href ? (
        <span className="hidden items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/85 sm:inline-flex">
          {t(label)} <ArrowRight size={12} className={isArabic ? "rotate-180" : ""} />
        </span>
      ) : null}
    </>
  ), [href, isArabic, label, t, text]);

  if (!enabled || dismissed || !text) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ top: reducedMotion ? 82 : top, opacity }}
      initial={reducedMotion ? false : { y: -18, opacity: 0 }}
      animate={reducedMotion ? undefined : { y: 0, opacity: 1 }}
    >
      <div className="pointer-events-auto flex w-full max-w-4xl items-center justify-between gap-3 rounded-full border border-[#8a7ac4]/40 bg-[#0a0710]/88 px-4 py-2 shadow-[0_18px_60px_rgba(0,0,0,0.45),0_0_35px_rgba(96,81,155,0.22)] backdrop-blur-xl">
        {href ? (
          isExternal ? (
            <a href={href} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center justify-center gap-3 text-center">
              {body}
            </a>
          ) : (
            <Link to={href} className="flex min-w-0 flex-1 items-center justify-center gap-3 text-center">
              {body}
            </Link>
          )
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-center gap-3 text-center">{body}</div>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/55 transition hover:text-white"
          aria-label="Dismiss sticky banner"
        >
          <X size={13} />
        </button>
      </div>
    </motion.div>
  );
}
