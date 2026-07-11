import { useState } from "react";

export default function UserAvatar({ src, name, size = "md", className = "" }: { src?: string; name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const [failed, setFailed] = useState(false);
  const dimensions = size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-16 w-16 text-xl" : "h-12 w-12 text-base";
  const base = `${dimensions} shrink-0 overflow-hidden rounded-full border border-orange-300/25 bg-gradient-to-br from-orange-600 to-orange-400 font-serif text-white shadow-[0_0_20px_rgba(96,81,155,.18)] ${className}`;
  if (src && !failed) return <img src={src} alt={`${name} avatar`} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`${base} object-cover`} />;
  return <span className={`${base} inline-flex items-center justify-center`} aria-label={`${name} avatar`}>{name.trim().charAt(0).toUpperCase() || "?"}</span>;
}
