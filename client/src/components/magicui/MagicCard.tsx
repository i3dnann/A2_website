import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export default function MagicCard({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return <div className={cn("magic-card spotlight-card", className)} {...props}>{children}</div>;
}
