import { Activity, Gauge, Radio, Users } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useLiveStatus } from "../context/LiveStatusContext";
import { NumberTicker } from "./ui/number-ticker";

export default function HomeLiveStats() {
  const { t } = useLanguage();
  const { state, loading } = useLiveStatus();

  const online = state?.status === "online";
  const unavailable = loading || state?.configured === false || state?.status === "not_configured" || state?.status === "offline";
  const statusText = loading
    ? t("Checking server")
    : online
      ? t("Server Online")
      : state?.status === "reconnecting"
        ? t("Reconnecting")
      : state?.configured === false || state?.status === "not_configured"
        ? t("Status not configured")
        : t("Server Offline");
  const values = [
    { icon: Users, label: t("Online"), value: state?.count ?? 0, unavailable, suffix: "", color: "text-emerald-300" },
    { icon: Activity, label: t("Max Players"), value: state?.maxplayers ?? 0, unavailable, suffix: "", color: "text-violet-300" },
    { icon: Radio, label: t("Queue"), value: state?.queue ?? 0, unavailable, suffix: "", color: "text-cyan-300" },
    { icon: Gauge, label: t("Latency"), value: state?.latency ?? 0, unavailable: state?.latency == null, suffix: " ms", color: "text-blue-300" },
  ];

  return (
    <section className="relative px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="section-rise mx-auto max-w-[90rem]">
        <div className="surface-flat grid overflow-hidden rounded-[1.75rem] border border-white/[.09] lg:grid-cols-[19rem_1fr]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.08] p-6 lg:border-b-0 lg:border-r">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
                <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_14px_#34d399]" : "bg-white/30"}`} />
                {statusText}
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{t(state?.serverName || "Gotham City")}</h2>
              <p className="mt-1 text-xs text-white/60">Gotham City · CFW Roleplay</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-white/[.07] sm:grid-cols-4">
            {values.map(({ icon: Icon, label, value, unavailable: isUnavailable, suffix, color }) => (
              <div key={label} className="flex items-center gap-3 bg-[#0b0d14] px-4 py-6 transition hover:bg-[#111522] sm:px-6">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-white/[.035]">
                  <Icon size={16} className={color} />
                </span>
                <div>
                  <p className={`text-xl font-semibold leading-none tracking-tight ${color}`}>
                    {isUnavailable ? "—" : <><NumberTicker value={value} className={`tracking-tight ${color}`} />{suffix}</>}
                  </p>
                  <p className="mt-1.5 text-xs text-white/60">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
