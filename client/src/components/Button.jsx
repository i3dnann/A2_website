import clsx from "clsx";

export function Button({ as: Component = "button", className, variant = "primary", ...props }) {
  return (
    <Component
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-a2-green/40 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-a2-green text-black hover:brightness-110",
        variant === "ghost" && "border border-a2-border bg-white/5 text-white hover:border-a2-green/60 hover:bg-a2-green/10",
        variant === "danger" && "bg-a2-danger text-white hover:brightness-110",
        className
      )}
      {...props}
    />
  );
}
