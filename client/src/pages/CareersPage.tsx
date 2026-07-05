import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api, MOCK } from "../api/client";
import { useSite } from "../context/SiteContext";
import PageShell from "../components/PageShell";
import { staggerContainer, staggerItem } from "../components/Reveal";

type CareerRow = {
  id: string;
  title?: string;
  role?: string;
  department?: string;
  dept?: string;
  description?: string;
  requirements?: string;
  is_open?: boolean | number;
  is_visible?: boolean | number;
};

function isOpen(row: CareerRow) {
  return row.is_open !== false && row.is_open !== 0 && row.is_visible !== false && row.is_visible !== 0;
}

export default function CareersPage() {
  const { content } = useSite();
  const [careers, setCareers] = useState<CareerRow[]>([]);
  const [loading, setLoading] = useState(!MOCK);
  const [error, setError] = useState("");

  useEffect(() => {
    if (MOCK) {
      setCareers([]);
      setLoading(false);
      return;
    }
    let cancel = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await api<{ rows: CareerRow[] }>("/api/public/careers", { params: { limit: 100 } });
        if (!cancel) setCareers(result.rows || []);
      } catch (e: any) {
        if (!cancel) {
          setError(e?.message || "Could not load careers.");
          setCareers([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, []);

  return (
    <PageShell subtitle={content.careersSubtitle} title={content.careersTitle}>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <p className="max-w-sm text-white/55">{content.careersDesc}</p>
          <a
            href="#positions"
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-orange-400/40 hover:bg-white/10"
          >
            View Careers Portal <ArrowRight size={16} />
          </a>
          {error && <p className="mt-4 text-sm text-orange-200">{error}</p>}
        </motion.div>
        <motion.div id="positions" variants={staggerContainer} initial="hidden" animate="show" className="flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-sm text-white/55">
              <Loader2 size={16} className="animate-spin" /> Loading open positions...
            </div>
          ) : careers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center text-sm text-white/45">
              No open positions are posted right now.
            </div>
          ) : careers.map((career) => (
            <motion.div
              key={career.id}
              variants={staggerItem}
              whileHover={{ x: isOpen(career) ? 6 : 0 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition-colors hover:border-orange-300/30"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="font-serif text-base text-white">{career.title || career.role || "Open Position"}</p>
                    <p className="text-xs uppercase tracking-wider text-white/40">{career.department || career.dept || "Department"}</p>
                    {career.description && <p className="mt-1 line-clamp-2 max-w-lg text-xs text-white/45">{career.description}</p>}
                  </div>
                </div>
                {isOpen(career) ? (
                  <Link
                    to={`/careers/${career.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-300/30 bg-orange-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-orange-200 transition hover:bg-orange-300/15"
                  >
                    Apply <ArrowRight size={13} />
                  </Link>
                ) : (
                  <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                    Closed
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </PageShell>
  );
}
