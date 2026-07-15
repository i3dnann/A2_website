import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { X, Info, Layers } from "lucide-react";
import { getItemVisual } from "../lib/itemIcon";
import ModalPortal from "./ModalPortal";

export type InventoryItemData = {
  name?: string;
  label?: string;
  amount?: number;
  count?: number;
  info?: Record<string, any>;
  metadata?: Record<string, any>;
};

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};

const slotVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function InventoryGrid({ items }: { items: InventoryItemData[] }) {
  const [active, setActive] = useState<InventoryItemData | null>(null);

  if (!items.length) {
    return (
      <div className="spotlight-card rounded-xl border border-dashed border-white/10 p-8 text-center">
        <Layers className="mx-auto text-white/15" size={26} />
        <p className="mt-2 text-xs text-white/40">Inventory is empty.</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6"
      >
        {items.map((it, i) => {
          const label = it.name || it.label || "Item";
          const amount = it.amount ?? it.count ?? 1;
          const meta = it.info || it.metadata;
          const { icon: Icon, color, glow } = getItemVisual(label);

          return (
            <motion.button
              key={i}
              variants={slotVariants}
              whileHover={{ y: -4, scale: 1.045 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActive(it)}
              className="spotlight-card group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition-colors hover:border-orange-400/40"
            >
              {/* glow backdrop */}
              <div className={`absolute inset-0 bg-gradient-to-br ${glow} opacity-70 transition-opacity duration-300 group-hover:opacity-100`} />

              {/* animated corner shine on hover */}
              <motion.div
                className="pointer-events-none absolute -inset-8 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100"
                animate={{ rotate: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative flex h-full flex-col items-center justify-center gap-1.5">
                <Icon size={22} className={`${color} drop-shadow transition-transform duration-300 group-hover:scale-110`} />
                <p className="line-clamp-1 max-w-full px-1 text-center text-[10px] font-medium text-white/70">{label}</p>
              </div>

              {/* amount badge */}
              <span className="absolute bottom-1 right-1 flex h-5 min-w-5 items-center justify-center rounded-md border border-white/10 bg-black/70 px-1 text-[10px] font-bold text-white shadow-sm">
                ×{amount}
              </span>

              {meta && Object.keys(meta).length > 0 && (
                <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500/80 text-white">
                  <Info size={9} />
                </span>
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Item detail popover */}
      <ModalPortal open={Boolean(active)} onClose={() => setActive(null)}>
        <AnimatePresence>
          {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] grid place-items-center overflow-hidden bg-black/75 p-3 backdrop-blur-sm sm:p-6"
            onClick={() => setActive(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="inventory-item-title"
              className="modal-surface max-h-[calc(100dvh-1.5rem)] w-full max-w-sm overflow-y-auto overflow-x-hidden rounded-2xl border border-white/10 p-6"
            >
              {(() => {
                const label = active.name || active.label || "Item";
                const amount = active.amount ?? active.count ?? 1;
                const meta = active.info || active.metadata;
                const { icon: Icon, color, glow } = getItemVisual(label);
                return (
                  <>
                    <div className="flex items-start justify-between">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${glow} border border-white/10`}>
                        <Icon size={26} className={color} />
                      </div>
                      <button onClick={() => setActive(null)} className="text-white/40 hover:text-white"><X size={18} /></button>
                    </div>
                    <h3 id="inventory-item-title" className="mt-4 font-serif text-lg text-white">{label}</h3>
                    <p className="text-xs uppercase tracking-wider text-white/40">Quantity: ×{amount}</p>
                    {meta && Object.keys(meta).length > 0 ? (
                      <div className="mt-4 flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/30 p-3">
                        {Object.entries(meta).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between text-xs">
                            <span className="capitalize text-white/40">{k.replace(/_/g, " ")}</span>
                            <span className="max-w-[60%] truncate text-right text-white/80">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-xs text-white/35">No additional metadata for this item.</p>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>
    </>
  );
}
