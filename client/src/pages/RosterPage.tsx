import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, MessageCircle, Radio, Tv, X } from "lucide-react";
import { useSite, type RosterItem } from "../context/SiteContext";
import { getIcon } from "../lib/iconMap";
import PageShell from "../components/PageShell";
import { staggerContainer, staggerItem } from "../components/Reveal";

export default function RosterPage() {
  const { content } = useSite();
  const [selected, setSelected] = useState<RosterItem | null>(null);
  const groups = useMemo(() => {
    const map = new Map<string, RosterItem[]>();
    content.roster.forEach((member) => {
      const key = member.category || member.role || "Community";
      map.set(key, [...(map.get(key) || []), member]);
    });
    return [...map.entries()];
  }, [content.roster]);

  return (
    <PageShell subtitle={content.rosterSubtitle} title={content.rosterTitle}>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mx-auto -mt-8 mb-10 max-w-xl text-center text-white/55"
      >
        {content.rosterDesc}
      </motion.p>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <p className="font-serif text-xl text-white">No roster members added yet</p>
          <p className="mt-2 text-sm text-white/45">Add roster profiles from the admin panel.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {groups.map(([group, members]) => (
            <section key={group}>
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <h2 className="rounded-full border border-[#60519b]/35 bg-[#60519b]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[#d7ceff]">
                  {group}
                </h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"
              >
                {members.map((member) => (
                  <RosterCircle key={`${group}-${member.name}`} member={member} onClick={() => setSelected(member)} />
                ))}
              </motion.div>
            </section>
          ))}
        </div>
      )}

      <RosterProfile member={selected} onClose={() => setSelected(null)} />
    </PageShell>
  );
}

function RosterCircle({ member, onClick }: { member: RosterItem; onClick: () => void }) {
  const Icon = getIcon(member.icon);
  return (
    <motion.button
      type="button"
      variants={staggerItem}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex min-w-0 flex-col items-center text-center focus:outline-none"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-[#60519b]/30 blur-xl opacity-0 transition group-hover:opacity-100" />
        <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/12 bg-gradient-to-br from-[#1a1328] to-black shadow-[0_18px_40px_rgba(0,0,0,0.36)] transition group-hover:border-[#8a7ac4]/65 sm:h-32 sm:w-32">
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <Icon size={34} className="text-[#c8bcff]" />
          )}
        </div>
      </div>
      <h3 className="mt-4 max-w-full truncate font-serif text-lg text-white">{member.name}</h3>
      <p className="mt-1 max-w-full truncate text-xs font-semibold uppercase tracking-wider text-white/45">{member.role}</p>
    </motion.button>
  );
}

function RosterProfile({ member, onClose }: { member: RosterItem | null; onClose: () => void }) {
  if (!member) return null;
  const Icon = getIcon(member.icon);
  const links = [
    { label: "Discord", url: member.discordUrl, icon: MessageCircle },
    { label: "Twitch", url: member.twitchUrl, icon: Tv },
    { label: "Kick", url: member.kickUrl, icon: Radio },
    { label: "YouTube", url: member.youtubeUrl, icon: ExternalLink },
    { label: "Instagram", url: member.instagramUrl, icon: ExternalLink },
    { label: "X", url: member.xUrl, icon: ExternalLink },
  ].map((link) => ({ ...link, url: externalUrl(link.url) })).filter((link) => link.url);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          onClick={(event) => event.stopPropagation()}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#08060d] shadow-2xl"
        >
          <button onClick={onClose} className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 transition hover:text-white">
            <X size={16} />
          </button>
          <div className="relative h-24 bg-[radial-gradient(circle_at_top,#60519b55,transparent_58%),linear-gradient(135deg,#100b18,#020203)]">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:18px_18px]" />
          </div>
          <div className="px-5 pb-6 sm:px-6">
            <div className="-mt-12 flex flex-col items-center text-center">
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-[#08060d] bg-[#15101f] shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                {member.avatar ? <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" /> : <Icon size={40} className="text-[#c8bcff]" />}
              </div>
              <h2 className="mt-4 font-serif text-3xl text-white">{member.name}</h2>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-[#b8abef]">{member.role}</p>
              <p className="mt-1 text-xs text-white/40">{member.category || member.count}</p>
            </div>

            {member.banner && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/25 shadow-[0_16px_36px_rgba(0,0,0,0.25)]">
                <img src={member.banner} alt={`${member.name} banner`} className="aspect-[16/6] w-full object-cover" loading="lazy" />
              </div>
            )}

            {member.bio && (
              <p className="mt-5 whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/70">
                {member.bio}
              </p>
            )}

            {links.length > 0 && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {links.map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-[#8a7ac4]/50 hover:text-white">
                    <link.icon size={14} /> {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function externalUrl(value?: string) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}
