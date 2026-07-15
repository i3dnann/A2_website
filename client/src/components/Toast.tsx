import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type Toast = { id: string; kind: "success" | "error" | "info"; message: string };
type ToastCtx = { push: (t: Omit<Toast, "id">) => void; confirm: (opts: { title: string; message?: string; confirmText?: string }) => Promise<boolean> };

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message?: string; confirmText?: string;
    resolve?: (v: boolean) => void;
  }>({ open: false, title: "", message: "" });

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  const confirm = useCallback((opts: { title: string; message?: string; confirmText?: string }) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ open: true, title: opts.title, message: opts.message, confirmText: opts.confirmText || "Confirm", resolve });
    });
  }, []);

  const dismissConfirm = (val: boolean) => {
    confirmState.resolve?.(val);
    setConfirmState((s) => ({ ...s, open: false, resolve: undefined }));
  };

  return (
    <Ctx.Provider value={{ push, confirm }}>
      {children}

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast-enter pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${
                t.kind === "success"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                  : t.kind === "error"
                  ? "border-red-400/30 bg-red-500/10 text-red-100"
                  : "border-white/15 bg-black/70 text-white"
              }`}
            >
              {t.kind === "success" && <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
              {t.kind === "error" && <AlertCircle size={18} className="mt-0.5 shrink-0" />}
              {t.kind === "info" && <Info size={18} className="mt-0.5 shrink-0" />}
              <p className="flex-1 text-sm">{t.message}</p>
              <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="text-white/50 hover:text-white"><X size={14} /></button>
            </div>
          ))}
      </div>

      {/* Confirm modal */}
        {confirmState.open && (
          <div
            className="modal-fade-in fixed inset-0 z-[190] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => dismissConfirm(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="modal-panel-in w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0710] p-6 shadow-2xl"
            >
              <h3 className="font-serif text-lg text-white">{confirmState.title}</h3>
              {confirmState.message && <p className="mt-2 text-sm text-white/60">{confirmState.message}</p>}
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => dismissConfirm(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Cancel</button>
                <button onClick={() => dismissConfirm(true)} className="rounded-lg bg-gradient-to-r from-orange-600 to-orange-400 px-4 py-2 text-sm font-semibold text-white">{confirmState.confirmText}</button>
              </div>
            </div>
          </div>
        )}
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

// ──────────────────────────────────────────────────────────────────────
// Loading skeleton
// ──────────────────────────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="spotlight-card rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="mt-4 h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}
