import { Marquee } from "./ui/marquee";

const phrase = "SERIOUS ROLEPLAY  •  LIVING STORIES  •  YOUR CITY  •  ";

export default function CinematicInterlude() {
  return (
    <section aria-label="Gotham City values" className="relative overflow-hidden border-y border-white/8 py-5 sm:py-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,92,255,.12),transparent_65%)]" />
      <Marquee repeat={3} className="[--duration:48s] [--gap:0rem] p-0 text-4xl font-semibold tracking-[-.04em] text-white/[.07] sm:text-6xl lg:text-7xl">
        <span className="px-4">{phrase}</span>
      </Marquee>
    </section>
  );
}
