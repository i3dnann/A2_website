import { useEffect, useState } from "react";
import { Activity, Gauge, Radio, Users } from "lucide-react";
import { createLiveSubscriber, type LiveState } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

export default function HomeLiveStats() {
  const { t } = useLanguage();
  const [state, setState] = useState<LiveState | null>(null);

  useEffect(() => {
    const subscription = createLiveSubscriber(setState);
    return () => subscription.stop();
  }, []);

  const online = state?.status === "online";
  const unavailable = state?.configured === false || state?.status === "not_configured";
  const values = [
    { icon: Users, label: t("Online"), value: unavailable ? "—" : String(state?.count ?? 0), color: "text-emerald-300" },
    { icon: Activity, label: t("Max Players"), value: unavailable ? "—" : String(state?.maxplayers ?? 0), color: "text-violet-300" },
    { icon: Radio, label: t("Queue"), value: unavailable ? "—" : String(state?.queue ?? 0), color: "text-cyan-300" },
    { icon: Gauge, label: t("Latency"), value: state?.latency == null ? "—" : `${state.latency} ms`, color: "text-orange-300" },
  ];

  return (
    <section className="border-y border-white/10 bg-[#07070a] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-emerald-400/20 bg-[linear-gradient(110deg,rgba(16,185,129,.07),rgba(96,81,155,.05),rgba(255,255,255,.02))] p-5 shadow-[0_18px_50px_rgba(0,0,0,.3)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-emerald-200">
                <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_12px_#34d399]" : "bg-white/30"}`} />
                {online ? t("Server Online") : t("Server Status")}
              </div>
              <h2 className="mt-2 font-serif text-xl text-white sm:text-2xl">{t(state?.serverName || "Gotham City")}</h2>
            </div>
            <p className="text-xs text-white/40">Gotham City · CFW Roleplay</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {values.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                <Icon size={17} className={color} />
                <div><p className={`font-serif text-lg leading-none ${color}`}>{value}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">{label}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
