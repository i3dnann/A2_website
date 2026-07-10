import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

type Partner = {
  id: string;
  partner_name?: string;
  logo_url?: string;
  website_url?: string;
};

export default function PartnerBar() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    let cancel = false;
    api<{ rows: Partner[] }>("/api/public/partners", { params: { limit: 100 } })
      .then((result) => {
        if (!cancel) setPartners((result.rows || []).filter((partner) => partner.partner_name || partner.logo_url));
      })
      .catch(() => {
        if (!cancel) setPartners([]);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const rows = useMemo(() => {
    const clean = partners.filter(Boolean);
    if (!clean.length) return [[], []] as Partner[][];
    const repeatCount = Math.max(12, Math.ceil(18 / clean.length));
    const repeated = Array.from({ length: repeatCount }).flatMap(() => clean);
    return [repeated, [...repeated].reverse()] as Partner[][];
  }, [partners]);

  if (!partners.length) return null;

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#050407]/95 py-8">
      <style>{`
        @keyframes partner-drift-left { from { transform: translate3d(0,0,0); } to { transform: translate3d(-50%,0,0); } }
        @keyframes partner-drift-right { from { transform: translate3d(-50%,0,0); } to { transform: translate3d(0,0,0); } }
        @media (prefers-reduced-motion: reduce) {
          .partner-marquee { animation: none !important; transform: none !important; }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#050407] to-transparent sm:w-36" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#050407] to-transparent sm:w-36" />

      <div className="mx-auto mb-4 flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#9b8ad8]">{t("Partners")}</p>
          <h2 className="mt-1 font-serif text-xl text-white sm:text-2xl">{t("Trusted city allies")}</h2>
        </div>
        <div className="hidden rounded-full border border-[#60519b]/35 bg-[#60519b]/10 px-3 py-1 text-xs font-semibold text-[#c8bcff] sm:block">
          {partners.length} {t("active")}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <div key={index} className="w-full overflow-hidden">
            <div
              className="partner-marquee flex w-max min-w-[200vw] gap-3 pr-3"
              style={{
                animation: `${index === 0 ? "partner-drift-left" : "partner-drift-right"} ${Math.max(34, row.length * 4)}s linear infinite`,
              }}
            >
              {[...row, ...row].map((partner, itemIndex) => (
                <PartnerCard key={`${partner.id}-${index}-${itemIndex}`} partner={partner} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  const { t } = useLanguage();
  const name = partner.partner_name || "Partner";
  const content = (
    <div className="group flex h-20 w-64 items-center gap-4 rounded-xl border border-white/10 bg-white/[0.035] px-4 shadow-[0_14px_30px_rgba(0,0,0,0.25)] transition hover:border-[#8a7ac4]/50 hover:bg-[#60519b]/12 hover:shadow-[0_0_28px_rgba(96,81,155,0.22)]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/35">
        {partner.logo_url ? (
          <img src={partner.logo_url} alt={name} className="h-full w-full object-contain p-1.5" loading="lazy" />
        ) : (
          <span className="font-serif text-lg text-[#c8bcff]">{name.slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{t(name)}</p>
        <p className="mt-1 text-xs text-white/40">{t("Community partner")}</p>
      </div>
      <ExternalLink size={14} className="shrink-0 text-white/35 transition group-hover:text-[#c8bcff]" />
    </div>
  );

  const url = externalUrl(partner.website_url);
  if (!url) return content;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8a7ac4]">
      {content}
    </a>
  );
}

function externalUrl(value?: string) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}
