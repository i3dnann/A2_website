import type { ContractRecord } from "./types";

export default function ContractPaper({
  contract,
  compact = false,
}: {
  contract: ContractRecord;
  compact?: boolean;
}) {
  const parties = contract.parties || [],
    signatures = contract.signatures || [],
    content = contract.version?.content || {};
  return (
    <article
      className={`contract-paper relative mx-auto overflow-hidden bg-[#fffdf8] text-[#191714] shadow-[0_28px_90px_rgba(0,0,0,.5)] ${compact ? "min-h-[680px] w-full max-w-[720px] p-8 sm:p-12" : "min-h-[1122px] w-[794px] p-[70px]"}`}
      aria-label={`Contract ${contract.contract_number}`}
    >
      <div className="contract-watermark" aria-hidden="true">
        GC
      </div>
      <header className="border-b border-[#29241e]/30 pb-5 text-center">
        <img
          src="/images/logo-emblem.png"
          alt="Gotham City seal"
          className="mx-auto mb-3 h-14 w-14 object-contain grayscale"
        />
        <p className="text-[10px] font-bold tracking-[.35em]">
          GOTHAM CITY — OFFICIAL DOCUMENT
        </p>
        <h1 className="mt-3 font-serif text-2xl font-bold uppercase tracking-wide">
          {contract.title}
        </h1>
        <p className="mt-2 text-[11px]">
          {contract.contract_type} · {contract.contract_number} · Version{" "}
          {contract.current_version}
        </p>
      </header>
      <section className="mt-5 grid grid-cols-2 gap-x-8 gap-y-1 border-y border-[#29241e]/20 py-3 text-[10px]">
        <p>
          <b>Effective date:</b> {contract.effective_date || "Not specified"}
        </p>
        <p>
          <b>Status:</b> {contract.status}
        </p>
        <p>
          <b>Expiration:</b>{" "}
          {contract.expiration_date
            ? new Date(contract.expiration_date).toLocaleDateString()
            : "Not applicable"}
        </p>
        <p>
          <b>Jurisdiction:</b> {String(content.jurisdiction || "Gotham City")}
        </p>
      </section>
      <section className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {parties.map((party) => (
          <div key={party.id} className="border border-[#29241e]/25 p-4">
            <div className="flex items-start gap-3">
              <img
                src={party.logo_url || "/images/logo-emblem.png"}
                alt={
                  party.logo_url
                    ? `${party.display_name} logo`
                    : "Fallback Gotham City seal"
                }
                className="h-12 w-12 object-contain grayscale"
              />
              <div>
                <p className="text-[9px] font-bold tracking-[.2em]">
                  {party.party_position === "PARTY_A" ? "PARTY A" : "PARTY B"}
                </p>
                <h2 className="font-serif text-base font-bold">
                  {party.display_name}
                </h2>
                <p className="text-[9px] text-[#5a534a]">
                  {party.party_type}
                  {!party.logo_url ? " · Fallback seal" : ""}
                </p>
              </div>
            </div>
            <dl className="mt-4 space-y-1 text-[10px]">
              <div>
                <dt className="inline font-bold">Representative: </dt>
                <dd className="inline">{party.representative_name}</dd>
              </div>
              <div>
                <dt className="inline font-bold">Role: </dt>
                <dd className="inline">
                  {party.representative_role || "Authorized representative"}
                </dd>
              </div>
              {party.registration_identifier && (
                <div>
                  <dt className="inline font-bold">Identifier: </dt>
                  <dd className="inline">{party.registration_identifier}</dd>
                </div>
              )}
            </dl>
          </div>
        ))}
      </section>
      {[
        ["introduction", "Agreement introduction"],
        ["purpose", "Purpose"],
        ["definitions", "Definitions"],
      ].map(([key, label]) =>
        content[key] ? (
          <section key={key} className="mt-6">
            <h2 className="contract-heading">{label}</h2>
            <p className="contract-copy">{String(content[key])}</p>
          </section>
        ) : null,
      )}
      <section className="mt-7 space-y-5">
        {(contract.clauses || []).map((clause) => (
          <div key={`${clause.clause_number}-${clause.title}`}>
            <h2 className="contract-heading">
              {clause.clause_number}. {clause.title}
            </h2>
            <p className="contract-copy whitespace-pre-wrap">
              {clause.content}
            </p>
          </div>
        ))}
      </section>
      <section className="mt-10 break-inside-avoid border-t border-[#29241e]/30 pt-5">
        <h2 className="text-xs font-bold tracking-[.22em]">SIGNATURES</h2>
        <div className="mt-5 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {parties.map((party) => {
            const sig = signatures.find((s) => s.party_id === party.id);
            return (
              <div
                key={party.id}
                className="min-h-28 border-b border-[#29241e]/50 pb-2"
              >
                <p className="text-[10px] font-bold">{party.display_name}</p>
                {sig?.signature_method === "drawn" &&
                sig.drawn_signature_data ? (
                  <img
                    src={sig.drawn_signature_data}
                    alt={`Signature of ${party.representative_name}`}
                    className="my-2 h-14 max-w-full object-contain"
                  />
                ) : (
                  <p className="my-3 font-serif text-2xl italic">
                    {sig?.typed_signature || "Unsigned"}
                  </p>
                )}
                <p className="text-[9px]">
                  {party.representative_name} ·{" "}
                  {party.representative_role || "Representative"}
                </p>
                <p className="text-[8px] text-[#5a534a]">
                  {sig
                    ? new Date(sig.signed_at).toLocaleString(undefined, {
                        timeZoneName: "short",
                      })
                    : "Awaiting signature"}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <footer className="mt-10 border-t border-[#29241e]/25 pt-3 text-center text-[8px] leading-relaxed text-[#5a534a]">
        This document and its electronic signatures are created exclusively for
        roleplay use within the Gotham City FiveM server. It is not intended to
        create a legally enforceable real-world agreement.
        {contract.version?.document_hash && (
          <>
            <br />
            SHA-256: {contract.version.document_hash}
          </>
        )}
      </footer>
    </article>
  );
}
