import { Link } from "react-router-dom";
import { AtSign, Globe, MessageCircle, Radio } from "lucide-react";
import { useSite } from "../context/SiteContext";

const FOOTER_LINKS = [
  { path: "/", label: "Home" },
  { path: "/server", label: "Server" },
  { path: "/roster", label: "Roster" },
  { path: "/live", label: "Live" },
  { path: "/journey", label: "Journey" },
  { path: "/news", label: "News" },
  { path: "/careers", label: "Careers" },
  { path: "/faq", label: "FAQ" },
];

export default function Footer() {
  const { content } = useSite();
  return (
    <footer className="relative border-t border-white/10 pb-10 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/images/logo-emblem.png" alt={content.siteName} className="h-9 w-9 object-contain" />
              <span className="font-serif text-lg tracking-[0.2em] text-white">{content.siteName}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-white/50">A Gotham City inspired FiveM QBCore roleplay community built for players who crave immersive, story-driven experiences.</p>
            <div className="mt-5 flex gap-3">
              {[Radio, MessageCircle, Globe, AtSign].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 transition hover:border-fuchsia-400/40 hover:text-fuchsia-300"><Icon size={16} /></a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">Navigate</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {FOOTER_LINKS.map((l) => (
                <li key={l.path}><Link to={l.path} className="text-sm text-white/60 transition hover:text-white">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">Resources</h4>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
              <li><a href="#" className="transition hover:text-white">Rules</a></li>
              <li><Link to="/dashboard" className="transition hover:text-white">Tickets</Link></li>
              <li><a href="#" className="transition hover:text-white">Server Map</a></li>
              <li><a href="#" className="transition hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">Stay Updated</h4>
            <p className="mt-4 text-sm text-white/50">Get the latest news and event announcements from A2 Studio.</p>
            <form className="mt-4 flex overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <input type="email" placeholder="you@email.com" className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none" />
              <button type="submit" className="whitespace-nowrap bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 text-sm font-semibold text-white">Join</button>
            </form>
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} {content.siteName}. Not affiliated with Rockstar Games or WB Entertainment.</p>
          <p>Built with passion for the roleplay community.</p>
        </div>
      </div>
    </footer>
  );
}
