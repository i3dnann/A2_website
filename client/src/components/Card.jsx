import clsx from "clsx";

export function Card({ className, children }) {
  return <section className={clsx("glass rounded-lg p-5 shadow-glow", className)}>{children}</section>;
}

export function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-white/58">{label}</p>
          <p className="mt-2 text-3xl font-black text-white">{value ?? "0"}</p>
          {hint && <p className="mt-2 text-xs text-white/45">{hint}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg border border-a2-border bg-a2-green/10 p-2 text-a2-green">
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}
