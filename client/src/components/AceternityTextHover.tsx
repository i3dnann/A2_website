import { motion, useReducedMotion } from "framer-motion";

type Props = {
  text: string;
  className?: string;
};

export default function AceternityTextHover({ text, className = "" }: Props) {
  const reducedMotion = useReducedMotion();

  return (
    <span className={`aceternity-text-hover group relative inline-block ${className}`} aria-label={text}>
      <span className="pointer-events-none absolute inset-0 text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.28)]">
        {text}
      </span>
      <motion.span
        className="relative block bg-gradient-to-r from-white via-[#c7b8ff] to-[#60519b] bg-clip-text text-transparent"
        initial={false}
        animate={reducedMotion ? undefined : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "220% 220%" }}
      >
        {text}
      </motion.span>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-[#c7b8ff] to-transparent transition-transform duration-500 group-hover:scale-x-100" />
    </span>
  );
}
