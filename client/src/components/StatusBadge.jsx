import clsx from "clsx";

export function StatusBadge({ status, live = false }) {
  const normalized = String(status || (live ? "LIVE" : "Unknown")).toLowerCase();
  const good = live || ["accepted", "approved", "published", "online", "active", "live", "delivered"].includes(normalized);
  const warn = ["submitted", "under review", "waiting for player", "waiting for staff", "draft", "pending", "unknown"].includes(normalized);
  const bad = ["rejected", "offline", "closed", "cancelled", "blacklisted", "hidden"].includes(normalized);
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-wide",
        good && "border-a2-green/50 bg-a2-green/12 text-a2-green",
        warn && "border-a2-warning/50 bg-a2-warning/10 text-a2-warning",
        bad && "border-a2-danger/50 bg-a2-danger/10 text-a2-danger",
        !good && !warn && !bad && "border-a2-border bg-white/5 text-white/70"
      )}
    >
      {live ? "LIVE" : status || "Unknown"}
    </span>
  );
}
