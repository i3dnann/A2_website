import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export default function ShimmerButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <button className={cn("magic-shimmer-button", className)} {...props}><span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span></button>;
}
