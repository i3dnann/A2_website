import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  gradient?: boolean;
  className?: string;
};

export default function AceternityTextHover({ children, gradient = false, className = "" }: Props) {
  const textClass = gradient
    ? "bg-gradient-to-r from-orange-400 via-orange-300 to-orange-200 bg-clip-text text-transparent drop-shadow-[0_0_22px_rgba(96,81,155,0.35)]"
    : "text-white";

  return (
    <span className={`aceternity-text-hover group relative inline-block ${className}`}>
      <span className={`relative z-10 ${textClass}`}>{children}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 max-w-0 overflow-hidden bg-gradient-to-r from-white via-[#c7b8ff] to-[#60519b] bg-clip-text text-transparent opacity-0 [-webkit-text-stroke:1px_rgba(255,255,255,0.62)] transition-all duration-700 ease-out group-hover:max-w-[120%] group-hover:opacity-100"
      >
        {children}
      </span>
    </span>
  );
}
