import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, FilePlus2, Loader2, Send } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../Toast";
import ContractPaper from "./ContractPaper";
import type { ContractClause, ContractRecord } from "./types";

type UserOption = { id: string; username: string; email?: string };
type PartyForm = {
  party_type: string;
  display_name: string;
  registration_identifier: string;
  logo_url: string;
  representative_user_id: string;
  representative_character_id: string;
  representative_name: string;
  representative_role: string;
};
const types = [
  "Employment agreement",
  "Vehicle sale agreement",
  "Property rental agreement",
  "Loan agreement",
  "Business partnership agreement",
  "Legal settlement",
  "Service agreement",
  "Custom roleplay agreement",
];
const steps = [
  "Contract type",
  "Party A",
  "Party B",
  "Contract details",
  "Clauses and terms",
  "Signers",
  "Dates",
  "Attachments",
  "Preview",
  "Issue",
];
const fieldClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 text-sm outline-none focus:border-[#8a7ac4]";
const emptyParty = (): PartyForm => ({
  party_type: "Company",
  display_name: "",
  registration_identifier: "",
  logo_url: "",
  representative_user_id: "",
  representative_character_id: "",
  representative_name: "",
  representative_role: "",
});
const initial = () => ({
  title: "",
  contract_type: types[0],
  party_a: emptyParty(),
  party_b: emptyParty(),
  content: {
    introduction: "",
    purpose: "",
    definitions: "",
    jurisdiction: "Gotham City",
  },
  clauses: [
    { clause_number: "1", title: "Responsibilities", content: "" },
  ] as ContractClause[],
  effective_date: new Date().toISOString().slice(0, 10),
  expiration_date: "",
  public_verification_enabled: true,
  internal_admin_notes: "",
});

export default function AdminContracts() {
  const { push } = useToast();
  const [rows, setRows] = useState<ContractRecord[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ContractRecord | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const result = await api<{ contracts: ContractRecord[] }>(
        "/api/contracts/admin",
        { params: { limit: 25 } },
      );
      setRows(result.contracts || []);
    } catch (error) {
      push({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Could not load contracts",
      });
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
    api<{ rows: UserOption[] }>("/api/admin/users", { params: { limit: 100 } })
      .then((result) => setUsers(result.rows || []))
      .catch(() => setUsers([]));
  }, []);

  const partyPatch = (key: "party_a" | "party_b", patch: Partial<PartyForm>) =>
    setForm((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  const preview = useMemo<ContractRecord>(
    () => ({
      id: "preview",
      contract_number: "Assigned on save",
      title: form.title || "Untitled agreement",
      contract_type: form.contract_type,
      status: "Draft",
      current_version: 1,
      created_at: new Date().toISOString(),
      effective_date: form.effective_date,
      expiration_date: form.expiration_date,
      version: { id: "preview", content: form.content },
      parties: [
        { id: "a", party_position: "PARTY_A", ...form.party_a },
        { id: "b", party_position: "PARTY_B", ...form.party_b },
      ],
      clauses: form.clauses,
      signatures: [],
    }),
    [form],
  );

  const save = async (send: boolean) => {
    setBusy(true);
    try {
      const result = await api<{ contract: ContractRecord }>(
        "/api/contracts/admin",
        { method: "POST", body: form },
      );
      if (send)
        await api(`/api/contracts/admin/${result.contract.id}/send`, {
          method: "POST",
        });
      push({
        kind: "success",
        message: send ? "Contract issued for signature" : "Draft saved",
      });
      setCreating(false);
      setStep(0);
      setForm(initial());
      await load();
    } catch (error) {
      push({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Could not save contract",
      });
    } finally {
      setBusy(false);
    }
  };

  const open = async (id: string) => {
    setBusy(true);
    try {
      const result = await api<{ contract: ContractRecord }>(
        `/api/contracts/${id}`,
      );
      setSelected(result.contract);
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

  const transition = async (action: "send" | "archive" | "cancel") => {
    if (!selected) return;
    const reason =
      action === "cancel"
        ? window.prompt("Administrative cancellation reason")
        : "";
    if (action === "cancel" && !reason) return;
    setBusy(true);
    try {
      await api(`/api/contracts/admin/${selected.id}/${action}`, {
        method: "POST",
        body: { reason },
      });
      await open(selected.id);
      await load();
      push({ kind: "success", message: "Contract updated" });
    } catch (error) {
      push({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Administrative action failed",
      });
    } finally {
      setBusy(false);
    }
  };

  const partyFields = (key: "party_a" | "party_b") => {
    const party = form[key];
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            "party_type",
            "display_name",
            "registration_identifier",
            "logo_url",
            "representative_name",
            "representative_role",
          ] as const
        ).map((name) => (
          <label key={name} className="text-sm capitalize">
            {name.replace(/_/g, " ")}
            <input
              className={fieldClass}
              value={party[name]}
              onChange={(event) =>
                partyPatch(key, { [name]: event.target.value })
              }
            />
          </label>
        ))}
      </div>
    );
  };

  if (selected)
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="mb-5 flex items-center gap-2 text-sm text-white/55"
        >
          <ArrowLeft size={15} />
          Contracts
        </button>
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="max-h-[72vh] overflow-y-auto rounded-2xl bg-black/25 p-4">
            <ContractPaper contract={selected} compact />
          </div>
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[.025] p-5">
            <p className="text-xs uppercase tracking-widest text-white/35">
              Administrative controls
            </p>
            <h2 className="mt-2 font-serif text-lg">
              {selected.contract_number}
            </h2>
            <p className="mt-1 text-sm text-white/45">
              {selected.status} · {selected.signatures?.length || 0}/2 signed
            </p>
            <div className="mt-5 space-y-2">
              {selected.status === "Draft" && (
                <button
                  disabled={busy}
                  onClick={() => transition("send")}
                  className="w-full rounded-xl bg-[#60519b] py-3 text-sm"
                >
                  Send for signature
                </button>
              )}
              {selected.status === "Completed" && (
                <button
                  disabled={busy}
                  onClick={() => transition("archive")}
                  className="w-full rounded-xl border border-white/15 py-3 text-sm"
                >
                  Archive
                </button>
              )}
              {!["Cancelled", "Voided", "Archived"].includes(
                selected.status,
              ) && (
                <button
                  disabled={busy}
                  onClick={() => transition("cancel")}
                  className="w-full rounded-xl border border-red-400/20 py-3 text-sm text-red-300"
                >
                  Cancel contract
                </button>
              )}
            </div>
            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold text-white/55">
                Revision history
              </p>
              {selected.versions?.map((version) => (
                <p
                  key={version.version_number}
                  className="mt-2 text-xs text-white/35"
                >
                  Version {version.version_number} ·{" "}
                  {new Date(version.created_at).toLocaleDateString()}
                </p>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );

  if (!creating)
    return (
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">Contracts</h2>
            <p className="mt-1 text-sm text-white/40">
              Official dual-signature roleplay documents
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#55478a] to-[#8a7ac4] px-4 py-2.5 text-sm font-semibold"
          >
            <FilePlus2 size={16} />
            Create contract
          </button>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          {busy ? (
            <div className="p-12">
              <Loader2 className="mx-auto animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-12 text-center text-sm text-white/40">
              No contracts have been created.
            </p>
          ) : (
            rows.map((contract) => (
              <button
                key={contract.id}
                onClick={() => open(contract.id)}
                className="grid w-full gap-2 border-b border-white/5 px-5 py-4 text-left hover:bg-white/[.035] sm:grid-cols-[1fr_.8fr_.5fr_.25fr]"
              >
                <span>
                  <b className="block text-sm">{contract.title}</b>
                  <small className="text-white/35">
                    {contract.contract_number}
                  </small>
                </span>
                <span className="text-sm text-white/50">
                  {contract.contract_type}
                </span>
                <span className="text-sm">{contract.status}</span>
                <span className="text-right text-xs text-[#c9c0ea]">
                  {contract.signature_count || 0}/2
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    );

  return (
    <div>
      <button
        onClick={() => setCreating(false)}
        className="mb-5 flex items-center gap-2 text-sm text-white/55"
      >
        <ArrowLeft size={15} />
        Contracts
      </button>
      <div className="mb-5 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {steps.map((label, index) => (
            <button
              key={label}
              onClick={() => setStep(index)}
              className={`rounded-lg px-3 py-2 text-xs ${index === step ? "bg-[#60519b]" : "text-white/35"}`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[.025] p-6">
        <h2 className="font-serif text-2xl">{steps[step]}</h2>
        <div className="mt-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Contract type
                <select
                  className={fieldClass}
                  value={form.contract_type}
                  onChange={(event) =>
                    setForm({ ...form, contract_type: event.target.value })
                  }
                >
                  {types.map((type) => (
                    <option className="bg-[#151124]" key={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Contract title
                <input
                  className={fieldClass}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </label>
            </div>
          )}
          {step === 1 && partyFields("party_a")}
          {step === 2 && partyFields("party_b")}
          {step === 3 && (
            <div className="space-y-4">
              {(["introduction", "purpose", "definitions"] as const).map(
                (name) => (
                  <label key={name} className="block text-sm capitalize">
                    {name}
                    <textarea
                      className={`${fieldClass} min-h-24`}
                      value={form.content[name]}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          content: {
                            ...form.content,
                            [name]: event.target.value,
                          },
                        })
                      }
                    />
                  </label>
                ),
              )}
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4">
              {form.clauses.map((clause, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 p-4"
                >
                  <input
                    className={fieldClass}
                    placeholder="Clause title"
                    value={clause.title}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        clauses: form.clauses.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, title: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                  <textarea
                    className={`${fieldClass} min-h-24`}
                    placeholder="Clause content"
                    value={clause.content}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        clauses: form.clauses.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, content: event.target.value }
                            : item,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    clauses: [
                      ...form.clauses,
                      {
                        clause_number: String(form.clauses.length + 1),
                        title: "",
                        content: "",
                      },
                    ],
                  })
                }
                className="text-sm text-[#c9c0ea]"
              >
                + Add custom clause
              </button>
            </div>
          )}
          {step === 5 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {(["party_a", "party_b"] as const).map((key) => (
                <label key={key} className="text-sm">
                  Signer for {key === "party_a" ? "Party A" : "Party B"}
                  <select
                    className={fieldClass}
                    value={form[key].representative_user_id}
                    onChange={(event) =>
                      partyPatch(key, {
                        representative_user_id: event.target.value,
                      })
                    }
                  >
                    <option value="" className="bg-[#151124]">
                      Select authenticated account
                    </option>
                    {users.map((item) => (
                      <option
                        className="bg-[#151124]"
                        key={item.id}
                        value={item.id}
                      >
                        {item.username} {item.email ? `(${item.email})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
          {step === 6 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Effective date
                <input
                  type="date"
                  className={fieldClass}
                  value={form.effective_date}
                  onChange={(event) =>
                    setForm({ ...form, effective_date: event.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                Expiration
                <input
                  type="datetime-local"
                  className={fieldClass}
                  value={form.expiration_date}
                  onChange={(event) =>
                    setForm({ ...form, expiration_date: event.target.value })
                  }
                />
              </label>
            </div>
          )}
          {step === 7 && (
            <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">
              Attachments can be added to a saved draft and are locked when
              issued.
            </p>
          )}
          {step === 8 && (
            <div className="max-h-[65vh] overflow-y-auto rounded-xl bg-black/30 p-4">
              <ContractPaper contract={preview} compact />
            </div>
          )}
          {step === 9 && (
            <div>
              <label className="flex gap-2 text-sm text-white/60">
                <input
                  type="checkbox"
                  checked={form.public_verification_enabled}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      public_verification_enabled: event.target.checked,
                    })
                  }
                />
                Enable public authenticity verification
              </label>
              <textarea
                className={`${fieldClass} min-h-24`}
                placeholder="Private administrator notes"
                value={form.internal_admin_notes}
                onChange={(event) =>
                  setForm({ ...form, internal_admin_notes: event.target.value })
                }
              />
              <div className="mt-5 flex gap-3">
                <button
                  disabled={busy}
                  onClick={() => save(false)}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm"
                >
                  Save draft
                </button>
                <button
                  disabled={busy}
                  onClick={() => save(true)}
                  className="flex items-center gap-2 rounded-xl bg-[#60519b] px-5 py-3 text-sm font-semibold"
                >
                  <Send size={15} />
                  Save and send
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-7 flex justify-between border-t border-white/10 pt-5">
          <button
            disabled={step === 0}
            onClick={() => setStep(Math.max(0, step - 1))}
            className="flex items-center gap-2 text-sm disabled:opacity-20"
          >
            <ArrowLeft size={15} />
            Previous
          </button>
          {step < 9 && (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 rounded-xl bg-[#60519b] px-4 py-2.5 text-sm"
            >
              Continue
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
