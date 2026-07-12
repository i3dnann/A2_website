import { Star } from "lucide-react";

export default function VerifiedBadge({ className = "", title = "Verified account" }: { className?: string; title?: string }) {
  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#60519b] text-white shadow-[0_0_14px_rgba(138,122,196,0.62)] ring-1 ring-[#c9c0ea]/50 ${className}`}
    >
      <Star size={10} fill="currentColor" strokeWidth={2.4} />
    </span>
  );
}
