import type { CSSProperties } from "react";
import { cn } from "../../utils/cn";

export default function BorderBeam({ className = "", duration = 8, size = 90 }: { className?: string; duration?: number; size?: number }) {
  return <span aria-hidden="true" className={cn("magic-border-beam", className)} style={{ "--beam-duration": `${duration}s`, "--beam-size": `${size}px` } as CSSProperties} />;
}
