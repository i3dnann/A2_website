import { cn } from "../../utils/cn";

export default function AnimatedGridPattern({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={cn("magic-grid-pattern", className)} />;
}
