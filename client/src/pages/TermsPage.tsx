import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageShell from "../components/PageShell";
import { api, MOCK } from "../api/client";

type Terms = {
  title?: string;
  content?: string;
  version?: string;
  effective_date?: string;
};

const FALLBACK_TERMS: Terms = {
  title: "Terms of Service",
  content:
    "Respect staff, players, and roleplay. Follow the server rules, keep roleplay fair, and use support tickets when you need help from the team.",
  version: "1.0.0",
};

export default function TermsPage() {
  const [terms, setTerms] = useState<Terms>(FALLBACK_TERMS);
  const [loading, setLoading] = useState(!MOCK);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function loadTerms() {
      if (MOCK) return;
      setLoading(true);
      setError("");
      try {
        const res = await api<{ terms?: Terms }>("/api/public/terms");
        if (alive) setTerms(res.terms || FALLBACK_TERMS);
      } catch (err: any) {
        if (alive) setError(err?.message || "Could not load Terms of Service.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadTerms();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PageShell subtitle="Legal" title={terms.title || "Terms of Service"}>
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-black/45 p-6 shadow-[0_0_40px_rgba(96,81,155,0.12)] backdrop-blur sm:p-8"
      >
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/40">
          {terms.version && <span>Version {terms.version}</span>}
          {terms.effective_date && <span>Effective {terms.effective_date}</span>}
          {loading && <span>Loading latest terms</span>}
        </div>
        {error && (
          <p className="mb-5 rounded-xl border border-orange-300/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
            {error}
          </p>
        )}
        <div className="whitespace-pre-wrap text-sm leading-7 text-white/70 sm:text-base">
          {terms.content || FALLBACK_TERMS.content}
        </div>
      </motion.article>
    </PageShell>
  );
}
