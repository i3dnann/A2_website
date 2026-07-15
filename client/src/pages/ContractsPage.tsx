import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  FileSignature,
  Loader2,
  X,
} from "lucide-react";
import { api, apiUrl } from "../api/client";
import { getFirebaseAuth } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import ContractPaper from "../components/contracts/ContractPaper";
import SignatureCanvas from "../components/contracts/SignatureCanvas";
import type { ContractRecord } from "../components/contracts/types";
import ModalPortal from "../components/ModalPortal";

export default function ContractsPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<ContractRecord[]>([]);
  const [selected, setSelected] = useState<ContractRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<"typed" | "drawn">("typed");
  const [signature, setSignature] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api<{ contracts: ContractRecord[] }>(
        "/api/contracts/mine",
      );
      setRows(result.contracts || []);
    } catch (error) {
      push({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Could not load contracts",
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const open = async (id: string) => {
    setBusy(true);
    try {
      const result = await api<{ contract: ContractRecord }>(
        `/api/contracts/${id}`,
      );
      setSelected(result.contract);
      setReviewed(false);
      setAgreed(false);
      setSignature("");
    } catch (error) {
      push({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Could not open contract",
      });
    } finally {
      setBusy(false);
    }
  };

  const party = selected?.parties?.find(
    (item) => item.representative_user_id === user?.id,
  );
  const signed = Boolean(
    selected?.signatures?.some((item) => item.party_id === party?.id),
  );
  const signable = Boolean(
    selected &&
      [
        "Ready for review",
        "Awaiting first signature",
        "Awaiting second signature",
        "Partially signed",
      ].includes(selected.status) &&
      !signed,
  );

  const sign = async () => {
    if (!selected || !party) return;
    setBusy(true);
    try {
      const firebaseAuth = await getFirebaseAuth();
      const reauthToken = await firebaseAuth?.currentUser?.getIdToken(true);
      await api(`/api/contracts/${selected.id}/sign`, {
        method: "POST",
        body: {
          method,
          typed_signature: method === "typed" ? signature : "",
          drawn_signature: method === "drawn" ? signature : "",
          reviewed,
          agreed,
          reauthToken,
          reauthProvider: reauthToken ? "firebase" : "gotham_session",
        },
      });
      push({
        kind: "success",
        message: "Contract signed. Your signature is now immutable.",
      });
      await open(selected.id);
      await load();
    } catch (error) {
      push({
        kind: "error",
        message: error instanceof Error ? error.message : "Signature failed",
      });
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/contracts/${selected.id}/decline`, {
        method: "POST",
        body: { reason },
      });
      push({ kind: "success", message: "Contract declined" });
      setDeclineOpen(false);
      await open(selected.id);
      await load();
    } catch (error) {
      push({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not decline",
      });
    } finally {
      setBusy(false);
    }
  };

  if (selected)
    return (
      <div className="relative min-h-screen pt-28 pb-20">
        <div className="mx-auto max-w-7xl px-4">
          <button
            onClick={() => setSelected(null)}
            className="mb-5 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft size={16} />
            My Contracts
          </button>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div
              ref={scrollRef}
              onScroll={(event) => {
                const el = event.currentTarget;
                if (el.scrollHeight - el.scrollTop - el.clientHeight < 60)
                  setReviewed(true);
              }}
              className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl bg-black/30 p-3 sm:p-6"
            >
              <ContractPaper contract={selected} compact />
            </div>
            <aside className="h-fit rounded-2xl border border-white/10 bg-[#0d0a13]/90 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-white/35">
                Signature progress
              </p>
              <h1 className="mt-2 font-serif text-xl">{selected.title}</h1>
              <p className="mt-1 text-xs text-white/45">
                {selected.contract_number}
              </p>
              <div className="mt-5 space-y-3">
                {selected.parties?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 p-3 text-sm"
                  >
                    <span>{item.display_name}</span>
                    {selected.signatures?.some(
                      (sig) => sig.party_id === item.id,
                    ) ? (
                      <span className="text-emerald-300">Signed</span>
                    ) : (
                      <span className="text-white/35">Pending</span>
                    )}
                  </div>
                ))}
              </div>
              {selected.pdf && (
                <a
                  href={apiUrl(`/api/contracts/${selected.id}/pdf`)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm"
                >
                  <Download size={16} />
                  Download final PDF
                </a>
              )}
              {signable && (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-sm font-semibold">
                    Sign as {party?.representative_name}
                  </p>
                  <div className="mt-3 flex rounded-xl bg-white/5 p-1">
                    <button
                      onClick={() => {
                        setMethod("typed");
                        setSignature("");
                      }}
                      className={`flex-1 rounded-lg py-2 text-xs ${method === "typed" ? "bg-[#60519b]" : "text-white/45"}`}
                    >
                      Typed
                    </button>
                    <button
                      onClick={() => {
                        setMethod("drawn");
                        setSignature("");
                      }}
                      className={`flex-1 rounded-lg py-2 text-xs ${method === "drawn" ? "bg-[#60519b]" : "text-white/45"}`}
                    >
                      Drawn
                    </button>
                  </div>
                  {method === "typed" ? (
                    <input
                      value={signature}
                      onChange={(event) => setSignature(event.target.value)}
                      placeholder={party?.representative_name}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 font-serif italic outline-none focus:border-[#8a7ac4]"
                    />
                  ) : (
                    <div className="mt-3">
                      <SignatureCanvas onChange={setSignature} />
                    </div>
                  )}
                  <label className="mt-4 flex gap-2 text-xs text-white/60">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(event) => setAgreed(event.target.checked)}
                    />
                    I have reviewed the document and agree to sign as the
                    displayed character and role.
                  </label>
                  {!reviewed && (
                    <p className="mt-2 text-[11px] text-amber-300/80">
                      Scroll through the complete document before signing.
                    </p>
                  )}
                  <button
                    disabled={busy || !reviewed || !agreed || !signature}
                    onClick={sign}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#55478a] to-[#8a7ac4] px-4 py-3 text-sm font-semibold disabled:opacity-40"
                  >
                    {busy ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <FileSignature size={16} />
                    )}
                    Sign contract
                  </button>
                  <button
                    onClick={() => setDeclineOpen(true)}
                    className="mt-2 w-full py-2 text-xs text-red-300"
                  >
                    Decline to sign
                  </button>
                </div>
              )}
              {signed && (
                <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
                  <Check size={15} className="mr-2 inline" />
                  You signed this version.
                </p>
              )}
            </aside>
          </div>
        </div>
        <ModalPortal open={declineOpen} onClose={() => setDeclineOpen(false)}>
          {declineOpen && (
          <div className="fixed inset-0 z-[220] grid place-items-center overflow-hidden bg-black/80 p-3 sm:p-6" onClick={() => setDeclineOpen(false)}>
            <div role="dialog" aria-modal="true" className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#100c17] p-6" onClick={(event) => event.stopPropagation()}>
              <button
                onClick={() => setDeclineOpen(false)}
                className="float-right"
              >
                <X size={18} />
              </button>
              <h2 className="font-serif text-xl">Decline contract</h2>
              <p className="mt-2 text-sm text-white/50">
                This stops further signing until an administrator issues a new
                revision.
              </p>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-4 min-h-28 w-full rounded-xl border border-white/10 bg-black/30 p-3 outline-none"
                placeholder="Required reason"
              />
              <button
                disabled={reason.trim().length < 3 || busy}
                onClick={decline}
                className="mt-4 w-full rounded-xl bg-red-500/80 py-3 text-sm font-semibold disabled:opacity-40"
              >
                Confirm decline
              </button>
            </div>
          </div>
          )}
        </ModalPortal>
      </div>
    );

  return (
    <div className="relative min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="font-serif text-3xl">My Contracts</h1>
        <p className="mt-1 text-sm text-white/45">
          Documents assigned to your authenticated Gotham City account.
        </p>
        {loading ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="animate-spin text-[#8a7ac4]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.03] p-12 text-center">
            <FileSignature className="mx-auto text-white/20" />
            <h2 className="mt-4 font-serif text-xl">No contracts</h2>
            <p className="mt-1 text-sm text-white/40">
              You have no assigned roleplay contracts.
            </p>
          </div>
        ) : (
          <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
            {rows.map((contract) => (
              <button
                key={contract.id}
                onClick={() => open(contract.id)}
                className="grid w-full gap-2 border-b border-white/5 px-5 py-4 text-left transition hover:bg-white/[.04] md:grid-cols-[1.2fr_.8fr_.6fr_.3fr] md:items-center"
              >
                <span>
                  <b className="block text-sm">{contract.title}</b>
                  <small className="text-white/35">
                    {contract.contract_number}
                  </small>
                </span>
                <span className="text-sm text-white/55">
                  {contract.contract_type}
                </span>
                <span className="w-fit rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60">
                  {contract.status}
                </span>
                <span className="text-right text-xs text-[#c9c0ea]">
                  Open →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
