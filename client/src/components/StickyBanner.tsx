import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSite } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";

export default function StickyBanner() {
  const { content } = useSite();
  const { t, isArabic } = useLanguage();

  const enabled = Boolean(content.stickyBannerEnabled);
  const text = content.stickyBannerText || "";
  const href = content.stickyBannerLink || "";
  const label = content.stickyBannerButton || "Open";
  const color = content.stickyBannerColor || "#60519b";
  const textColor = content.stickyBannerTextColor || "#ffffff";
  const isExternal = /^https?:\/\//i.test(href);

  const body = useMemo(() => (
    <>
      <span className="line-clamp-1 min-w-0 text-sm font-semibold" style={{ color: textColor }}>{t(text)}</span>
      {href ? (
        <span className="hidden items-center gap-1 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-wider sm:inline-flex" style={{ color: textColor }}>
          {t(label)} <ArrowRight size={12} className={isArabic ? "rotate-180" : ""} />
        </span>
      ) : null}
    </>
  ), [href, isArabic, label, t, text, textColor]);

  if (!enabled || !text) return null;

  return (
    <div
      className="banner-enter pointer-events-auto fixed inset-x-0 top-0 z-[70] flex min-h-10 items-center justify-center border-b border-white/10 px-4 shadow-[0_10px_35px_rgba(0,0,0,0.35)]"
      style={{ background: color }}
    >
      <div className="flex w-full max-w-7xl items-center justify-center gap-3 py-2 text-center">
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
      </div>
    </div>
  );
}
