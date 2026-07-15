import confetti from "canvas-confetti";

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

export function launchLoginFireworks() {
  if (typeof window === "undefined") return;

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;
  const siteStyles = window.getComputedStyle(document.documentElement);
  const primary = siteStyles.getPropertyValue("--site-primary").trim() || "#60519b";
  const accent = siteStyles.getPropertyValue("--site-accent").trim() || "#8a7ac4";
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
    colors: ["#ffffff", accent, primary, accent],
  };

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      window.clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}
