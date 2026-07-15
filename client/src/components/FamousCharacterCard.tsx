import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import type { FamousChar } from "../context/SiteContext";
import { useLanguage } from "../context/LanguageContext";
import ModalPortal from "./ModalPortal";

type FamousCharacterCardProps = {
  character: FamousChar;
  index: number;
};

export default function FamousCharacterCard({ character, index }: FamousCharacterCardProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const links = characterLinks(character);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: index * 0.08 }}
        whileHover={{ y: -6 }}
        className="spotlight-card relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6 text-left transition hover:border-[#8a7ac4]/45"
      >
        {character.image && <img src={character.image} alt={character.name} loading="lazy" className="-mx-2 -mt-2 mb-4 h-36 w-[calc(100%+1rem)] rounded-xl object-cover" />}
        <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200">{t(character.tag)}</span>
        <h3 className="mt-4 font-serif text-lg text-white">{t(character.name)}</h3>
        <p className="mt-1 text-sm text-white/50">{t(character.title)}</p>
        {character.bio && <p className="mt-3 line-clamp-3 text-xs text-white/40">{t(character.bio)}</p>}
        <p className="mt-4 text-xs font-semibold text-[#c8bcff]">{t("Read more")}</p>
      </motion.button>

      <ModalPortal open={open} onClose={() => setOpen(false)}>
        <AnimatePresence>
          {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] grid place-items-center overflow-hidden bg-black/80 p-3 backdrop-blur-md sm:p-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`famous-character-${index}`}
              className="modal-surface relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 sm:max-h-[calc(100dvh-3rem)]"
            >
              <button onClick={() => setOpen(false)} aria-label={t("Close")} className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white/70 transition hover:text-white">
                <X size={16} />
              </button>
              <div className="relative h-56 overflow-hidden bg-[radial-gradient(circle_at_top,#60519b55,transparent_58%),linear-gradient(135deg,#100b18,#020203)]">
                {character.image && <img src={character.image} alt={character.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08060d] via-[#08060d]/35 to-black/15" />
              </div>
              <div className="p-5 sm:p-7">
                <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-200">{t(character.tag)}</span>
                <h2 id={`famous-character-${index}`} className="mt-4 font-serif text-3xl text-white sm:text-4xl">{t(character.name)}</h2>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#b8abef]">{t(character.title)}</p>
                {character.bio ? (
                  <p className="mt-5 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/72">{t(character.bio)}</p>
                ) : (
                  <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40">{t("No character bio has been added yet.")}</p>
                )}
                {links.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {links.map((link) => (
                      <a key={`${link.label}-${link.url}`} href={externalUrl(link.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-[#8a7ac4]/50 hover:text-white">
                        <ExternalLink size={14} /> {t(link.label)}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </>
  );
}

function characterLinks(character: FamousChar) {
  const links = Array.isArray(character.links) ? character.links : [];
  if (links.length) return links.filter((link) => link.url);
  return character.link ? [{ label: "Open profile", url: character.link }] : [];
}

function externalUrl(value?: string) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}
