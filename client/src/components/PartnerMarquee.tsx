import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api, MOCK } from "../api/client";

type Partner = {
  id: string;
  partner_name?: string;
  name?: string;
  logo_url?: string;
  website_url?: string;
  is_visible?: boolean | number;
  sort_order?: number;
};

function visiblePartner(partner: Partner) {
  return partner.is_visible !== false && partner.is_visible !== 0;
}

function PartnerCard({ partner }: { partner: Partner }) {
  const name = partner.partner_name || partner.name || "Partner";
  const href = partner.website_url || "#";
  return (
    <a
      href={href}
      target={href === "#" ? undefined : "_blank"}
      rel={href === "#" ? undefined : "noreferrer"}
      className="group flex h-16 min-w-[180px] items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-white/70 transition hover:border-orange-300/35 hover:bg-orange-500/10 hover:text-white sm:h-20 sm:min-w-[220px]"
    >
      {partner.logo_url ? (
        <img src={partner.logo_url} alt={name} loading="lazy" className="h-9 max-w-[120px] object-contain opacity-80 transition group-hover:opacity-100 sm:h-11" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-300/25 bg-orange-500/10 font-serif text-orange-200">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="max-w-[120px] truncate">{name}</span>
      {href !== "#" && <ExternalLink size={13} className="text-white/30 transition group-hover:text-orange-200" />}
    </a>
  );
}

export default function PartnerMarquee() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      try {
        const result = await api<{ partners?: Partner[] }>("/api/public/home");
        const rows = (result.partners || []).filter(visiblePartner).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
        if (!cancel) setPartners(rows);
      } catch {
        if (!cancel) setPartners([]);
      }
    };
    if (MOCK) {
      setPartners([]);
      return;
    }
    load();
    return () => { cancel = true; };
  }, []);

  const rows = useMemo(() => {
    const source = partners.length >= 4
      ? partners
      : Array.from({ length: Math.max(8, partners.length * 8) }, (_, index) => partners[index % partners.length]).filter(Boolean);
    return [source, [...source].reverse()];
  }, [partners]);

  if (partners.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-black/20 py-6 sm:py-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#080808] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#080808] to-transparent" />
      <div className="mx-auto mb-4 max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200/80">Partners</p>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <div key={index} className="partner-marquee-track overflow-hidden">
            <div className={`partner-marquee-row ${index === 1 ? "partner-marquee-row-reverse" : ""}`}>
              {[...row, ...row, ...row, ...row].map((partner, itemIndex) => (
                <PartnerCard key={`${partner.id}-${index}-${itemIndex}`} partner={partner} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
