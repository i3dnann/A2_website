import { useEffect } from "react";
import { useSite } from "../context/SiteContext";

function cleanColor(value?: string) {
  const color = String(value || "").trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : "#8a7ac4";
}

export default function SpotlightSync() {
  const { content } = useSite();

  useEffect(() => {
    document.documentElement.style.setProperty("--spotlight-card-color", cleanColor(content.spotlightColor || content.accentHex));
  }, [content.accentHex, content.spotlightColor]);

  useEffect(() => {
    let frame = 0;
    const syncPointer = (event: PointerEvent) => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--spotlight-x", `${event.clientX}px`);
        document.documentElement.style.setProperty("--spotlight-y", `${event.clientY}px`);
        frame = 0;
      });
    };

    window.addEventListener("pointermove", syncPointer, { passive: true });
    return () => {
      window.removeEventListener("pointermove", syncPointer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
