import test from "node:test";
import assert from "node:assert/strict";
import { pdfBufferWebsite } from "../src/services/contractService.js";

test("website-style contract PDF stays on one A4 page for a short agreement", async () => {
  const parties = ["PARTY_A", "PARTY_B"].map((party_position, index) => ({
    id: `party-${index}`,
    party_position,
    party_type: "Company",
    display_name: `Party ${index + 1}`,
    registration_identifier: `GC-${index + 1}`,
    representative_name: `Signer ${index + 1}`,
    representative_role: "Director",
    logo_url: "",
  }));
  const buffer = await pdfBufferWebsite({
    title: "Service Agreement",
    contract_number: "GC-CON-2026-TEST",
    contract_type: "Service agreement",
    current_version: 1,
    status: "Completed",
    effective_date: "2026-07-13",
    expiration_date: null,
    verification_code: "verification-code",
    version: {
      content: {
        jurisdiction: "Gotham City",
        introduction: "Introduction",
        purpose: "Purpose",
        definitions: "Definitions",
      },
      document_hash: "a".repeat(64),
    },
    parties,
    clauses: [
      {
        clause_number: "1",
        title: "Responsibilities",
        content: "Both parties agree to the stated responsibilities.",
      },
    ],
    signatures: parties.map((party, index) => ({
      id: `signature-${index}`,
      party_id: party.id,
      signature_method: "typed",
      typed_signature: party.representative_name,
      signer_character_name: party.representative_name,
      signed_at: "2026-07-13T16:26:00.000Z",
      signed_document_hash: "a".repeat(64),
    })),
  });
  assert.equal(buffer.subarray(0, 4).toString(), "%PDF");
  assert.equal(
    (buffer.toString("latin1").match(/\/Type \/Page\b/g) || []).length,
    1,
  );
  assert.ok(buffer.length > 10_000);
});
