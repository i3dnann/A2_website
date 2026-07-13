import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldQuestion } from "lucide-react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
type Verification = {
  contract_number: string;
  title: string;
  contract_type: string;
  status: string;
  version: number;
  completion_date?: string;
  parties: string[];
  fingerprint?: string;
};
export default function ContractVerifyPage() {
  const { code } = useParams(),
    [data, setData] = useState<Verification | null>(null),
    [loading, setLoading] = useState(true),
    [invalid, setInvalid] = useState(false);
  useEffect(() => {
    api<{ contract: Verification }>(
      `/api/contracts/verify/${encodeURIComponent(code || "")}`,
    )
      .then((r) => setData(r.contract))
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [code]);
  return (
    <div className="relative min-h-screen pt-32 pb-20">
      <div className="mx-auto max-w-xl px-4">
        {loading ? (
          <Loader2 className="mx-auto animate-spin text-[#8a7ac4]" />
        ) : invalid || !data ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-10 text-center">
            <ShieldQuestion className="mx-auto text-red-300" />
            <h1 className="mt-4 font-serif text-2xl">Unknown document</h1>
            <p className="mt-2 text-sm text-white/45">
              This verification code is invalid or public verification is
              disabled.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#0d0a13]/90 p-8">
            <CheckCircle2 className="text-emerald-300" size={34} />
            <h1 className="mt-5 font-serif text-2xl">
              Contract authenticity record
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Only non-sensitive document information is shown.
            </p>
            <dl className="mt-7 divide-y divide-white/10 text-sm">
              {[
                ["Contract number", data.contract_number],
                ["Title", data.title],
                ["Type", data.contract_type],
                ["Parties", data.parties.join(" and ")],
                ["Status", data.status],
                ["Document version", String(data.version)],
                ["Fingerprint", data.fingerprint || "Unavailable"],
                [
                  "Completed",
                  data.completion_date
                    ? new Date(data.completion_date).toLocaleString()
                    : "Not completed",
                ],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-3">
                  <dt className="text-white/40">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
