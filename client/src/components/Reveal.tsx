import type { Variants } from "framer-motion";
import type { ReactNode } from "react";
import { BlurFade } from "./ui/blur-fade";

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <BlurFade
      className={className}
      delay={delay}
      duration={0.7}
      offset={y}
      direction="up"
      inView
      inViewMargin="-8%"
      blur="10px"
    >
      {children}
    </BlurFade>
  );
}

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(9px)", scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};
