import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { Marquee } from "./ui/marquee";

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

  if (!partners.length) return null;

  return (
    <section className="relative overflow-hidden px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="mx-auto max-w-[90rem] overflow-hidden rounded-[1.75rem] border border-white/[.08] bg-white/[.025] py-7 shadow-[0_24px_80px_rgba(0,0,0,.2)]">
        <div className="section-rise mb-5 flex items-end justify-between gap-4 px-6 sm:px-8">
          <div>
            <p className="text-xs font-medium text-violet-300">{t("Partners")}</p>
            <h2 className="magic-text mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t("Trusted city allies")}</h2>
          </div>
          <span className="hidden rounded-full border border-violet-300/15 bg-violet-400/[.08] px-3 py-1 text-xs text-violet-100/75 sm:block">
            {partners.length} {t("active")}
          </span>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0a0b11] to-transparent sm:w-28" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0a0b11] to-transparent sm:w-28" />
          <Marquee pauseOnHover repeat={4} className="[--duration:34s] [--gap:.75rem] py-2">
            {partners.map((partner) => <PartnerCard key={partner.id} partner={partner} />)}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  const { t } = useLanguage();
  const name = partner.partner_name || "Partner";
  const content = (
    <div className="group flex h-20 w-64 items-center gap-4 rounded-2xl border border-white/[.08] bg-[#0d0f18]/85 px-4 shadow-[0_14px_30px_rgba(0,0,0,.2)] transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-violet-400/[.07]">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/25">
        {partner.logo_url ? (
          <img src={partner.logo_url} alt={name} className="h-full w-full object-contain p-1.5" loading="lazy" />
        ) : (
          <span className="text-lg font-semibold text-violet-200">{name.slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{t(name)}</p>
        <p className="mt-1 text-xs text-white/40">{t("Community partner")}</p>
      </div>
      <ExternalLink size={14} className="shrink-0 text-white/30 transition group-hover:text-violet-200" />
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
