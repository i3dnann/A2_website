import { useEffect, useRef } from "react";

export default function SignatureCanvas({
  onChange,
}: {
  onChange: (data: string) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    drawing = useRef(false);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const scale = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * scale;
    canvas.height = canvas.clientHeight * scale;
    const ctx = canvas.getContext("2d");
    ctx?.scale(scale, scale);
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#17131f";
    }
  }, []);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const r = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - r.left, y: event.clientY - r.top };
  };
  return (
    <div>
      <canvas
        ref={ref}
        className="h-40 w-full touch-none rounded-xl border border-white/15 bg-white"
        aria-label="Draw signature"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = point(e),
            ctx = e.currentTarget.getContext("2d");
          ctx?.beginPath();
          ctx?.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = point(e),
            ctx = e.currentTarget.getContext("2d");
          ctx?.lineTo(p.x, p.y);
          ctx?.stroke();
        }}
        onPointerUp={(e) => {
          drawing.current = false;
          onChange(e.currentTarget.toDataURL("image/png", 0.7));
        }}
      />
      <button
        type="button"
        onClick={() => {
          const c = ref.current;
          c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
          onChange("");
        }}
        className="mt-2 text-xs text-white/55 hover:text-white"
      >
        Clear and redraw
      </button>
    </div>
  );
}
