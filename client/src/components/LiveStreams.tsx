import { motion } from "framer-motion";
import { Eye, Radio } from "lucide-react";
import { useEffect, useState } from "react";
import { api, MOCK } from "../api/client";
import { useSite } from "../context/SiteContext";
import { Reveal, staggerContainer, staggerItem } from "./Reveal";

export default function LiveStreams() {
  const { content } = useSite();
  const [streamers, setStreamers] = useState<any[]>(content.streamers);

  useEffect(() => {
    if (MOCK) return;
    let cancel = false;
    const load = async () => {
      try {
        const r = await api<{ streamers: any[] }>("/api/public/live");
        if (!cancel) setStreamers((r.streamers || []).map((s) => ({
          name: s.display_name || s.name || s.kick_username || s.twitch_username,
          platform: s.kick_username ? "Kick" : "Twitch",
          viewers: Number(s.viewer_count || 0),
          live: Boolean(s.is_live),
          game: s.stream_title || s.category || "Gotham City Roleplay",
          url: s.stream_url || (s.kick_username ? `https://kick.com/${s.kick_username}` : s.twitch_username ? `https://twitch.tv/${s.twitch_username}` : "")
        })));
      } catch {}
    };
    load();
    const timer = window.setInterval(load, 30_000);
    return () => { cancel = true; window.clearInterval(timer); };
  }, []);

  return (
    <section id="live" className="relative py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">{content.streamsSubtitle}</p>
          <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">{content.streamsTitle}</h2>
          <p className="mt-4 text-white/55">{content.streamsDesc}</p>
        </Reveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {streamers.map((s) => (
            <motion.a href={s.url || undefined} target="_blank" rel="noreferrer" key={s.name} variants={staggerItem} whileHover={{ y: -6 }} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-950 via-black to-orange-950">
                <Radio className="text-white/20" size={36} />
                {s.live && (
                  <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">● Live</motion.span>
                )}
                {s.live && <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/80"><Eye size={12} /> {s.viewers.toLocaleString()}</span>}
              </div>
              <div className="mt-4"><p className="font-serif text-base text-white">{s.name}</p><p className="mt-0.5 text-xs uppercase tracking-wider text-white/40">{s.platform} · {s.game}</p></div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
