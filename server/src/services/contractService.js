import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import PDFDocument from "pdfkit";
import { getPool } from "../config/db.js";
import { safeUrl } from "../utils/sanitize.js";
import { uploadBufferToCloudinary } from "./cloudinaryService.js";

export const CONTRACT_TYPES = [
  "Employment agreement",
  "Vehicle sale agreement",
  "Property rental agreement",
  "Loan agreement",
  "Business partnership agreement",
  "Legal settlement",
  "Service agreement",
  "Custom roleplay agreement",
];
export const TERMINAL_STATUSES = [
  "Completed",
  "Archived",
  "Declined",
  "Cancelled",
  "Expired",
  "Voided",
];
const SIGNABLE = [
  "Ready for review",
  "Awaiting first signature",
  "Awaiting second signature",
  "Partially signed",
];
const cleanText = (value, max = 20000) =>
  String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
const hash = (value) =>
  createHash("sha256")
    .update(Buffer.isBuffer(value) ? value : String(value))
    .digest("hex");
const json = (value, fallback) => {
  try {
    return typeof value === "string" ? JSON.parse(value) : (value ?? fallback);
  } catch {
    return fallback;
  }
};
const canonical = (value) =>
  value === null || typeof value !== "object"
    ? JSON.stringify(value)
    : Array.isArray(value)
      ? `[${value.map(canonical).join(",")}]`
      : `{${Object.keys(value)
          .sort()
          .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
          .join(",")}}`;
const q = async (connection, sql, params = {}) =>
  (await connection.execute(sql, params))[0];

function normalizeParty(input, position) {
  return {
    party_position: position,
    party_type: cleanText(input?.party_type, 40) || "Character",
    display_name: cleanText(input?.display_name, 190),
    registration_identifier: cleanText(input?.registration_identifier, 120),
    logo_url: cleanText(input?.logo_url, 2000),
    logo_storage_key: cleanText(input?.logo_storage_key, 255),
    organization_id: cleanText(input?.organization_id, 64),
    character_id: cleanText(input?.character_id, 64),
    representative_user_id: cleanText(input?.representative_user_id, 64),
    representative_character_id: cleanText(
      input?.representative_character_id,
      64,
    ),
    representative_name: cleanText(input?.representative_name, 190),
    representative_role: cleanText(input?.representative_role, 160),
    contact_information: cleanText(input?.contact_information, 1000),
    address: cleanText(input?.address, 1000),
    exceptional_dual_signer_override: input?.exceptional_dual_signer_override
      ? 1
      : 0,
    override_reason: cleanText(input?.override_reason, 1000),
  };
}

function normalizeContent(input = {}) {
  const allowed = [
    "introduction",
    "purpose",
    "definitions",
    "responsibilities_party_a",
    "responsibilities_party_b",
    "payment_compensation",
    "start_date",
    "end_date",
    "renewal_terms",
    "termination_conditions",
    "penalties",
    "confidentiality_terms",
    "dispute_resolution",
    "final_statement",
    "jurisdiction",
    "type_specific",
  ];
  return Object.fromEntries(
    allowed.map((key) => [
      key,
      typeof input[key] === "object"
        ? input[key]
        : cleanText(input[key], 30000),
    ]),
  );
}

async function audit(
  connection,
  contractId,
  versionId,
  actorId,
  action,
  metadata = {},
) {
  await q(
    connection,
    "INSERT INTO contract_audit_events (id,contract_id,contract_version_id,actor_user_id,action,metadata) VALUES (:id,:contract_id,:version_id,:actor_id,:action,:metadata)",
    {
      id: randomUUID(),
      contract_id: contractId,
      version_id: versionId || null,
      actor_id: actorId || null,
      action,
      metadata: JSON.stringify(metadata),
    },
  );
}

async function loadBundle(connection, id, lock = false) {
  const contracts = await q(
    connection,
    `SELECT * FROM contracts WHERE id=:id LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    { id },
  );
  const contract = contracts[0];
  if (!contract) return null;
  const versions = await q(
    connection,
    "SELECT * FROM contract_versions WHERE contract_id=:id ORDER BY version_number DESC",
    { id },
  );
  const version = versions.find(
    (v) => Number(v.version_number) === Number(contract.current_version),
  );
  const [parties, clauses, signatures, attachments, pdfs] = await Promise.all([
    q(
      connection,
      "SELECT * FROM contract_parties WHERE contract_version_id=:v ORDER BY party_position",
      { v: version.id },
    ),
    q(
      connection,
      "SELECT * FROM contract_clauses WHERE contract_version_id=:v ORDER BY sort_order, clause_number",
      { v: version.id },
    ),
    q(
      connection,
      "SELECT * FROM contract_signatures WHERE contract_version_id=:v AND revoked_at IS NULL ORDER BY signed_at",
      { v: version.id },
    ),
    q(
      connection,
      "SELECT id,original_filename,safe_filename,mime_type,file_size,file_hash,file_url,created_at FROM contract_attachments WHERE contract_version_id=:v ORDER BY created_at",
      { v: version.id },
    ),
    q(
      connection,
      "SELECT * FROM contract_pdf_files WHERE contract_version_id=:v LIMIT 1",
      { v: version.id },
    ),
  ]);
  return {
    ...contract,
    version: {
      ...version,
      content: json(version.content_json, {}),
      snapshot: json(version.document_snapshot, null),
    },
    versions: versions.map((v) => ({
      id: v.id,
      version_number: v.version_number,
      document_hash: v.document_hash,
      created_at: v.created_at,
      superseded_at: v.superseded_at,
    })),
    parties,
    clauses: clauses.map((c) => ({ ...c, metadata: json(c.metadata, {}) })),
    signatures,
    attachments,
    pdf: pdfs[0] || null,
  };
}

function snapshotOf(bundle) {
  return {
    contract: {
      contract_number: bundle.contract_number,
      title: bundle.title,
      contract_type: bundle.contract_type,
      current_version: bundle.current_version,
      effective_date: bundle.effective_date,
      expiration_date: bundle.expiration_date,
    },
    content: bundle.version.content,
    parties: bundle.parties.map(
      ({
        party_position,
        party_type,
        display_name,
        registration_identifier,
        logo_url,
        representative_user_id,
        representative_character_id,
        representative_name,
        representative_role,
        contact_information,
        address,
      }) => ({
        party_position,
        party_type,
        display_name,
        registration_identifier,
        logo_url,
        representative_user_id,
        representative_character_id,
        representative_name,
        representative_role,
        contact_information,
        address,
      }),
    ),
    clauses: bundle.clauses.map(
      ({ clause_number, title, content, sort_order, metadata }) => ({
        clause_number,
        title,
        content,
        sort_order,
        metadata,
      }),
    ),
    attachments: bundle.attachments.map(
      ({ original_filename, mime_type, file_size, file_hash }) => ({
        original_filename,
        mime_type,
        file_size,
        file_hash,
      }),
    ),
  };
}

export async function createContract(input, actor) {
  const pool = getPool();
  if (!pool)
    throw Object.assign(new Error("database_required"), { status: 503 });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const id = randomUUID(),
      versionId = randomUUID();
    const year = new Date().getUTCFullYear();
    const number = `GC-CON-${year}-${randomBytes(5).toString("hex").toUpperCase()}`;
    const type = CONTRACT_TYPES.includes(input.contract_type)
      ? input.contract_type
      : "Custom roleplay agreement";
    const a = normalizeParty(input.party_a, "PARTY_A"),
      b = normalizeParty(input.party_b, "PARTY_B");
    if (
      !cleanText(input.title, 190) ||
      !a.display_name ||
      !b.display_name ||
      !a.representative_user_id ||
      !b.representative_user_id ||
      !a.representative_name ||
      !b.representative_name
    )
      throw Object.assign(new Error("validation_failed"), { status: 422 });
    if (
      a.representative_user_id === b.representative_user_id &&
      !(b.exceptional_dual_signer_override && b.override_reason)
    )
      throw Object.assign(new Error("duplicate_signer_requires_override"), {
        status: 422,
      });
    await q(
      connection,
      "INSERT INTO contracts (id,contract_number,verification_code,title,contract_type,status,current_version,created_by_user_id,effective_date,expiration_date,public_verification_enabled) VALUES (:id,:number,:verification,:title,:type,'Draft',1,:actor,:effective,:expiration,:public)",
      {
        id,
        number,
        verification: randomBytes(24).toString("base64url"),
        title: cleanText(input.title, 190),
        type,
        actor: actor.id,
        effective: input.effective_date || null,
        expiration: input.expiration_date || null,
        public: input.public_verification_enabled === false ? 0 : 1,
      },
    );
    await q(
      connection,
      "INSERT INTO contract_versions (id,contract_id,version_number,content_json,internal_admin_notes,created_by_user_id) VALUES (:id,:contract,1,:content,:notes,:actor)",
      {
        id: versionId,
        contract: id,
        content: JSON.stringify(normalizeContent(input.content)),
        notes: cleanText(input.internal_admin_notes, 10000),
        actor: actor.id,
      },
    );
    for (const p of [a, b])
      await q(
        connection,
        `INSERT INTO contract_parties (id,contract_id,contract_version_id,party_position,party_type,organization_id,character_id,display_name,registration_identifier,logo_url,logo_storage_key,representative_user_id,representative_character_id,representative_name,representative_role,contact_information,address,exceptional_dual_signer_override,override_reason) VALUES (:id,:contract,:version,:party_position,:party_type,:organization_id,:character_id,:display_name,:registration_identifier,:logo_url,:logo_storage_key,:representative_user_id,:representative_character_id,:representative_name,:representative_role,:contact_information,:address,:exceptional_dual_signer_override,:override_reason)`,
        { id: randomUUID(), contract: id, version: versionId, ...p },
      );
    for (const [i, c] of (input.clauses || []).entries())
      await q(
        connection,
        "INSERT INTO contract_clauses (id,contract_version_id,clause_number,title,content,sort_order,metadata) VALUES (:id,:version,:number,:title,:content,:sort,:metadata)",
        {
          id: randomUUID(),
          version: versionId,
          number: cleanText(c.clause_number, 20) || String(i + 1),
          title: cleanText(c.title, 190),
          content: cleanText(c.content, 30000),
          sort: i,
          metadata: JSON.stringify(c.metadata || {}),
        },
      );
    await audit(connection, id, versionId, actor.id, "contract_created", {
      contract_number: number,
    });
    await connection.commit();
    return loadBundle(connection, id);
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

export async function updateDraft(id, input, actor) {
  const pool = getPool(),
    connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const bundle = await loadBundle(connection, id, true);
    if (!bundle) throw Object.assign(new Error("not_found"), { status: 404 });
    if (bundle.status !== "Draft")
      throw Object.assign(new Error("signed_version_locked"), { status: 409 });
    await q(
      connection,
      "UPDATE contracts SET title=:title,contract_type=:type,effective_date=:effective,expiration_date=:expiration,public_verification_enabled=:public WHERE id=:id",
      {
        id,
        title: cleanText(input.title ?? bundle.title, 190),
        type: CONTRACT_TYPES.includes(input.contract_type)
          ? input.contract_type
          : bundle.contract_type,
        effective: input.effective_date ?? bundle.effective_date,
        expiration: input.expiration_date ?? bundle.expiration_date,
        public: input.public_verification_enabled === false ? 0 : 1,
      },
    );
    await q(
      connection,
      "UPDATE contract_versions SET content_json=:content,internal_admin_notes=:notes WHERE id=:v",
      {
        v: bundle.version.id,
        content: JSON.stringify(
          normalizeContent(input.content ?? bundle.version.content),
        ),
        notes: cleanText(
          input.internal_admin_notes ?? bundle.version.internal_admin_notes,
          10000,
        ),
      },
    );
    if (input.clauses) {
      await q(
        connection,
        "DELETE FROM contract_clauses WHERE contract_version_id=:v",
        { v: bundle.version.id },
      );
      for (const [i, c] of input.clauses.entries())
        await q(
          connection,
          "INSERT INTO contract_clauses (id,contract_version_id,clause_number,title,content,sort_order,metadata) VALUES (:id,:v,:n,:t,:c,:s,:m)",
          {
            id: randomUUID(),
            v: bundle.version.id,
            n: cleanText(c.clause_number, 20) || String(i + 1),
            t: cleanText(c.title, 190),
            c: cleanText(c.content, 30000),
            s: i,
            m: JSON.stringify(c.metadata || {}),
          },
        );
    }
    await audit(connection, id, bundle.version.id, actor.id, "draft_edited");
    await connection.commit();
    return loadBundle(connection, id);
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

export async function sendContract(id, actor) {
  const pool = getPool(),
    c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const b = await loadBundle(c, id, true);
    if (!b) throw Object.assign(new Error("not_found"), { status: 404 });
    if (b.status !== "Draft")
      throw Object.assign(new Error("invalid_status"), { status: 409 });
    if (b.parties.length !== 2 || !b.clauses.length)
      throw Object.assign(new Error("contract_incomplete"), { status: 422 });
    const snapshot = snapshotOf(b),
      documentHash = hash(canonical(snapshot));
    await q(
      c,
      "UPDATE contract_versions SET document_snapshot=:snapshot,document_hash=:hash WHERE id=:v",
      {
        v: b.version.id,
        snapshot: JSON.stringify(snapshot),
        hash: documentHash,
      },
    );
    await q(
      c,
      "UPDATE contracts SET status='Awaiting first signature' WHERE id=:id",
      { id },
    );
    await audit(c, id, b.version.id, actor.id, "contract_sent", {
      document_hash: documentHash,
    });
    await c.commit();
    return loadBundle(c, id);
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

export async function listContracts(
  user,
  { admin = false, status = "", q: search = "", limit = 25, offset = 0 } = {},
) {
  const pool = getPool();
  if (!pool)
    throw Object.assign(new Error("database_required"), { status: 503 });
  const c = await pool.getConnection();
  try {
    const clauses = ["1=1"],
      params = {
        limit: Math.min(Math.max(Number(limit) || 25, 1), 100),
        offset: Math.max(Number(offset) || 0, 0),
      };
    if (!admin) {
      clauses.push(
        "EXISTS (SELECT 1 FROM contract_parties cp JOIN contract_versions cv ON cv.id=cp.contract_version_id WHERE cp.contract_id=c.id AND cv.version_number=c.current_version AND cp.representative_user_id=:user)",
      );
      params.user = user.id;
    }
    if (status) {
      clauses.push("c.status=:status");
      params.status = status;
    }
    if (search) {
      clauses.push("(c.contract_number LIKE :search OR c.title LIKE :search)");
      params.search = `%${cleanText(search, 100)}%`;
    }
    const rows = await q(
      c,
      `SELECT c.*, (SELECT COUNT(*) FROM contract_signatures s JOIN contract_versions v ON v.id=s.contract_version_id WHERE s.contract_id=c.id AND v.version_number=c.current_version AND s.revoked_at IS NULL) signature_count FROM contracts c WHERE ${clauses.join(" AND ")} ORDER BY c.created_at DESC LIMIT :limit OFFSET :offset`,
      params,
    );
    const total = (
      await q(
        c,
        `SELECT COUNT(*) total FROM contracts c WHERE ${clauses.join(" AND ")}`,
        params,
      )
    )[0].total;
    return {
      contracts: rows,
      total: Number(total),
      limit: params.limit,
      offset: params.offset,
    };
  } finally {
    c.release();
  }
}

export async function getAuthorizedContract(id, user, admin = false) {
  const pool = getPool(),
    c = await pool.getConnection();
  try {
    const b = await loadBundle(c, id);
    if (!b) return null;
    if (
      !admin &&
      !b.parties.some(
        (p) => String(p.representative_user_id) === String(user.id),
      )
    )
      throw Object.assign(new Error("forbidden"), { status: 403 });
    return admin ? b : publicContractView(b);
  } finally {
    c.release();
  }
}

function publicContractView(bundle) {
  if (!bundle) return bundle;
  const { version, ...rest } = bundle;
  return {
    ...rest,
    version: version
      ? {
          ...version,
          internal_admin_notes: "",
        }
      : version,
  };
}

export async function signContract(id, input, user) {
  const pool = getPool(),
    c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const b = await loadBundle(c, id, true);
    if (!b) throw Object.assign(new Error("not_found"), { status: 404 });
    if (!SIGNABLE.includes(b.status))
      throw Object.assign(new Error("contract_not_signable"), { status: 409 });
    if (b.expiration_date && new Date(b.expiration_date) <= new Date()) {
      await q(c, "UPDATE contracts SET status='Expired' WHERE id=:id", { id });
      throw Object.assign(new Error("contract_expired"), { status: 409 });
    }
    const party = b.parties.find(
      (p) => String(p.representative_user_id) === String(user.id),
    );
    if (!party)
      throw Object.assign(new Error("not_assigned_signer"), { status: 403 });
    if (b.signatures.some((s) => String(s.party_id) === String(party.id)))
      throw Object.assign(new Error("already_signed"), { status: 409 });
    const recalculated = hash(canonical(snapshotOf(b)));
    if (!b.version.document_hash || recalculated !== b.version.document_hash)
      throw Object.assign(new Error("document_changed"), { status: 409 });
    const method = input.method === "drawn" ? "drawn" : "typed",
      typed = cleanText(input.typed_signature, 190),
      drawn = String(input.drawn_signature || "");
    if (method === "typed" && typed !== party.representative_name)
      throw Object.assign(new Error("signature_name_mismatch"), {
        status: 422,
      });
    if (
      method === "drawn" &&
      (!/^data:image\/png;base64,/.test(drawn) || drawn.length > 350000)
    )
      throw Object.assign(new Error("invalid_drawn_signature"), {
        status: 422,
      });
    await q(
      c,
      "INSERT INTO contract_signatures (id,contract_id,contract_version_id,party_id,signer_user_id,signer_character_id,signer_character_name,signer_role,signature_method,typed_signature,drawn_signature_data,signed_document_hash,consent_text_version) VALUES (:id,:contract,:version,:party,:user,:character,:name,:role,:method,:typed,:drawn,:hash,'2026-07-13')",
      {
        id: randomUUID(),
        contract: id,
        version: b.version.id,
        party: party.id,
        user: user.id,
        character: party.representative_character_id || null,
        name: party.representative_name,
        role: party.representative_role || null,
        method,
        typed: method === "typed" ? typed : null,
        drawn: method === "drawn" ? drawn : null,
        hash: recalculated,
      },
    );
    const count = Number(
      (
        await q(
          c,
          "SELECT COUNT(*) count FROM contract_signatures WHERE contract_version_id=:v AND revoked_at IS NULL",
          { v: b.version.id },
        )
      )[0].count,
    );
    await q(
      c,
      "UPDATE contracts SET status=:status,completed_at=IF(:status='Completed',NOW(),completed_at) WHERE id=:id",
      { id, status: count >= 2 ? "Completed" : "Partially signed" },
    );
    await audit(
      c,
      id,
      b.version.id,
      user.id,
      party.party_position === "PARTY_A" ? "party_a_signed" : "party_b_signed",
      { method, document_hash: recalculated },
    );
    if (count >= 2)
      await audit(c, id, b.version.id, user.id, "contract_completed");
    await c.commit();
    const complete = await loadBundle(c, id);
    if (count >= 2)
      await generatePdf(id, user.id).catch((e) =>
        console.error("[contracts] PDF generation failed", e),
      );
    return complete;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

export async function declineContract(id, reason, user) {
  const pool = getPool(),
    c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const b = await loadBundle(c, id, true);
    if (!b) throw Object.assign(new Error("not_found"), { status: 404 });
    const party = b.parties.find(
      (p) => String(p.representative_user_id) === String(user.id),
    );
    if (!party || !SIGNABLE.includes(b.status))
      throw Object.assign(new Error("contract_not_declinable"), {
        status: 409,
      });
    const safeReason = cleanText(reason, 2000);
    if (safeReason.length < 3)
      throw Object.assign(new Error("decline_reason_required"), {
        status: 422,
      });
    await q(c, "UPDATE contracts SET status='Declined' WHERE id=:id", { id });
    await audit(c, id, b.version.id, user.id, "contract_declined", {
      party: party.party_position,
      reason: safeReason,
    });
    await c.commit();
    return loadBundle(c, id);
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

export async function adminTransition(id, action, reason, actor) {
  const map = {
      cancel: ["Cancelled", "contract_cancelled"],
      void: ["Voided", "contract_voided"],
      archive: ["Archived", "contract_archived"],
    },
    entry = map[action];
  if (!entry) throw Object.assign(new Error("invalid_action"), { status: 422 });
  const pool = getPool(),
    c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const b = await loadBundle(c, id, true);
    if (!b) throw Object.assign(new Error("not_found"), { status: 404 });
    if (action === "void" && !["Completed", "Archived"].includes(b.status))
      throw Object.assign(new Error("invalid_status"), { status: 409 });
    if (action === "archive" && b.status !== "Completed")
      throw Object.assign(new Error("invalid_status"), { status: 409 });
    const safeReason = cleanText(reason, 2000);
    if (action !== "archive" && !safeReason)
      throw Object.assign(new Error("reason_required"), { status: 422 });
    await q(
      c,
      `UPDATE contracts SET status=:status,${action === "cancel" ? "cancelled_at=NOW(),cancelled_by_user_id=:actor,cancellation_reason=:reason" : action === "void" ? "voided_at=NOW(),voided_by_user_id=:actor,void_reason=:reason" : "archived_at=NOW()"} WHERE id=:id`,
      { id, status: entry[0], actor: actor.id, reason: safeReason },
    );
    await audit(c, id, b.version.id, actor.id, entry[1], {
      reason: safeReason,
    });
    await c.commit();
    return loadBundle(c, id);
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

async function contractImage(source, fallback) {
  if (!source) return fallback;
  const safeSource = source.startsWith("data:image/") ? source : safeUrl(source, { allowRelative: false, allowFivem: false });
  if (!safeSource) return fallback;
  const hostname = safeSource.startsWith("data:image/") ? "" : new URL(safeSource).hostname.toLowerCase();
  const privateAddress = (address = "") => /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(String(address).toLowerCase()) ||
    address === "::1" ||
    String(address).toLowerCase().startsWith("fc") ||
    String(address).toLowerCase().startsWith("fd") ||
    String(address).toLowerCase().startsWith("fe80:");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || (isIP(hostname) && privateAddress(hostname))) return fallback;
  try {
    if (safeSource.startsWith("data:image/"))
      return Buffer.from(safeSource.split(",")[1], "base64");
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (addresses.some((entry) => privateAddress(entry.address))) return fallback;
    const response = await fetch(safeSource, { signal: AbortSignal.timeout(5000), redirect: "error" });
    if (!response.ok) return fallback;
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer.length <= 5 * 1024 * 1024 ? buffer : fallback;
  } catch {
    return fallback;
  }
}

function contractDate(value, includeTime = false) {
  if (!value) return "Not applicable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...(includeTime
      ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }
      : {}),
  }).format(date);
}

export async function pdfBufferWebsite(bundle) {
  const seal = await readFile(
    new URL("../../../client/public/images/logo-emblem.png", import.meta.url),
  );
  const partyLogos = await Promise.all(
    bundle.parties.map((party) => contractImage(party.logo_url, seal)),
  );
  const signatureImages = await Promise.all(
    bundle.signatures.map((signature) =>
      contractImage(signature.drawn_signature_data, null),
    ),
  );
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      bufferPages: true,
      compress: true,
      margins: { top: 58, bottom: 76, left: 42, right: 42 },
      info: { Title: bundle.title, Author: "Gotham City" },
    });
    const chunks = [],
      pageWidth = 595.28,
      contentWidth = pageWidth - 84,
      ink = "#171512",
      muted = "#5f584e";
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const decorate = () => {
      doc.save().rect(0, 0, doc.page.width, doc.page.height).fill("#fffdf8");
      doc.fillOpacity(0.018).fillColor("#59482e");
      for (let y = 8; y < doc.page.height; y += 12)
        doc.rect(0, y, doc.page.width, 0.25).fill();
      doc
        .fillOpacity(0.045)
        .font("Helvetica-Bold")
        .fontSize(190)
        .fillColor("#50483f")
        .text("GC", 0, 260, {
          width: doc.page.width,
          align: "center",
          lineBreak: false,
        });
      doc.restore().fillOpacity(1).fillColor(ink);
    };
    decorate();
    doc.on("pageAdded", () => {
      decorate();
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(muted)
        .text(`GOTHAM CITY - ${bundle.contract_number}`, 42, 24, {
          width: contentWidth,
        });
      doc
        .font("Helvetica")
        .text(`Version ${bundle.current_version}`, 42, 24, {
          width: contentWidth,
          align: "right",
        });
      doc.y = 58;
    });
    const ensure = (height) => {
      if (doc.y + height > doc.page.height - 82) doc.addPage();
    };
    const heading = (text) => {
      ensure(34);
      doc.moveDown(0.7);
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(ink)
        .text(String(text).toUpperCase(), 42, doc.y, {
          width: contentWidth,
          characterSpacing: 0.45,
        });
      doc.moveDown(0.35);
    };
    const paragraph = (text) =>
      doc
        .font("Times-Roman")
        .fontSize(9)
        .fillColor(ink)
        .text(String(text), 42, doc.y, {
          width: contentWidth,
          lineGap: 3,
          align: "justify",
        });

    doc.image(seal, pageWidth / 2 - 23, 46, { fit: [46, 46] });
    doc.y = 106;
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(
        "G O T H A M   C I T Y   -   O F F I C I A L   D O C U M E N T",
        42,
        doc.y,
        { width: contentWidth, align: "center" },
      );
    doc
      .moveDown(1.25)
      .font("Times-Bold")
      .fontSize(18)
      .text(String(bundle.title).toUpperCase(), { align: "center" });
    doc
      .moveDown(0.45)
      .font("Times-Roman")
      .fontSize(8.5)
      .text(
        `${bundle.contract_type} - ${bundle.contract_number} - Version ${bundle.current_version}`,
        { align: "center" },
      );
    doc
      .moveDown(1.5)
      .strokeColor("#918a80")
      .lineWidth(0.45)
      .moveTo(42, doc.y)
      .lineTo(pageWidth - 42, doc.y)
      .stroke();
    doc.moveDown(1.1);
    const metaY = doc.y;
    doc
      .font("Times-Bold")
      .fontSize(8)
      .text("Effective date:", 42, metaY, { continued: true })
      .font("Times-Roman")
      .text(` ${contractDate(bundle.effective_date)}`);
    doc
      .font("Times-Bold")
      .text("Expiration:", 42, metaY + 16, { continued: true })
      .font("Times-Roman")
      .text(` ${contractDate(bundle.expiration_date)}`);
    doc
      .font("Times-Bold")
      .text("Status:", 310, metaY, { continued: true })
      .font("Times-Roman")
      .text(` ${bundle.status}`);
    doc
      .font("Times-Bold")
      .text("Jurisdiction:", 310, metaY + 16, { continued: true })
      .font("Times-Roman")
      .text(` ${bundle.version.content.jurisdiction || "Gotham City"}`);
    doc.y = metaY + 37;
    doc
      .strokeColor("#aaa299")
      .moveTo(42, doc.y)
      .lineTo(pageWidth - 42, doc.y)
      .stroke();
    doc.moveDown(1.3);

    const partyY = doc.y,
      gap = 16,
      boxWidth = (contentWidth - gap) / 2;
    bundle.parties.forEach((party, index) => {
      const x = 42 + index * (boxWidth + gap);
      doc
        .lineWidth(0.45)
        .strokeColor("#918a80")
        .rect(x, partyY, boxWidth, 126)
        .stroke();
      try {
        doc.image(partyLogos[index], x + 14, partyY + 17, { fit: [38, 38] });
      } catch {
        doc.image(seal, x + 14, partyY + 17, { fit: [38, 38] });
      }
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(ink)
        .text(
          party.party_position === "PARTY_A" ? "P A R T Y  A" : "P A R T Y  B",
          x + 62,
          partyY + 17,
          { width: boxWidth - 75 },
        );
      doc
        .font("Times-Bold")
        .fontSize(12)
        .text(party.display_name, x + 62, partyY + 34, {
          width: boxWidth - 75,
        });
      doc
        .font("Times-Roman")
        .fontSize(8)
        .fillColor(muted)
        .text(party.party_type, x + 62, partyY + 51, { width: boxWidth - 75 });
      doc
        .fillColor(ink)
        .font("Times-Bold")
        .text("Representative:", x + 14, partyY + 78, { continued: true })
        .font("Times-Roman")
        .text(` ${party.representative_name}`);
      doc
        .font("Times-Bold")
        .text("Role:", x + 14, partyY + 94, { continued: true })
        .font("Times-Roman")
        .text(` ${party.representative_role || "Authorized representative"}`);
      if (party.registration_identifier)
        doc
          .font("Times-Bold")
          .text("Identifier:", x + 14, partyY + 110, { continued: true })
          .font("Times-Roman")
          .text(` ${party.registration_identifier}`);
    });
    doc.y = partyY + 133;
    for (const [key, label] of [
      ["introduction", "Agreement introduction"],
      ["purpose", "Purpose"],
      ["definitions", "Definitions"],
    ])
      if (bundle.version.content[key]) {
        heading(label);
        paragraph(bundle.version.content[key]);
      }
    for (const clause of bundle.clauses) {
      ensure(55);
      heading(`${clause.clause_number}. ${clause.title}`);
      paragraph(clause.content);
    }

    ensure(176);
    doc
      .moveDown(1.3)
      .strokeColor("#918a80")
      .moveTo(42, doc.y)
      .lineTo(pageWidth - 42, doc.y)
      .stroke();
    heading("S I G N A T U R E S");
    const signatureY = doc.y + 4;
    bundle.parties.forEach((party, index) => {
      const x = 42 + index * (boxWidth + gap),
        signature = bundle.signatures.find(
          (item) => String(item.party_id) === String(party.id),
        );
      const signatureIndex = bundle.signatures.findIndex(
        (item) => String(item.id) === String(signature?.id),
      );
      doc
        .font("Times-Bold")
        .fontSize(8)
        .fillColor(ink)
        .text(party.display_name, x, signatureY, { width: boxWidth });
      let renderedDrawing = false;
      if (
        signature?.signature_method === "drawn" &&
        signatureImages[signatureIndex]
      ) {
        try {
          doc.image(signatureImages[signatureIndex], x, signatureY + 16, {
            fit: [115, 48],
          });
          renderedDrawing = true;
        } catch {
          renderedDrawing = false;
        }
      }
      if (!renderedDrawing)
        doc
          .font("Times-Italic")
          .fontSize(18)
          .text(
            signature?.typed_signature ||
              signature?.signer_character_name ||
              "Unsigned",
            x,
            signatureY + 25,
            { width: boxWidth },
          );
      doc
        .font("Times-Roman")
        .fontSize(7.5)
        .text(
          `${party.representative_name} - ${party.representative_role || "Representative"}`,
          x,
          signatureY + 76,
          { width: boxWidth },
        );
      doc
        .fontSize(6.8)
        .fillColor(muted)
        .text(
          signature
            ? contractDate(signature.signed_at, true)
            : "Awaiting signature",
          x,
          signatureY + 90,
          { width: boxWidth },
        );
      doc
        .strokeColor("#918a80")
        .moveTo(x, signatureY + 112)
        .lineTo(x + boxWidth, signatureY + 112)
        .stroke();
    });
    doc.y = signatureY + 123;
    doc
      .font("Helvetica")
      .fontSize(6.3)
      .fillColor(muted)
      .text(
        `Verification: ${bundle.verification_code}  |  SHA-256: ${bundle.version.document_hash}`,
        42,
        doc.y,
        { width: contentWidth, align: "center" },
      );
    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page += 1) {
      doc.switchToPage(page);
      const footerY = doc.page.height - 58;
      const previousBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .strokeColor("#aaa299")
        .lineWidth(0.4)
        .moveTo(42, footerY - 8)
        .lineTo(pageWidth - 42, footerY - 8)
        .stroke();
      doc
        .font("Times-Roman")
        .fontSize(6.1)
        .fillColor(muted)
        .text(
          "This document and its electronic signatures are created exclusively for roleplay use within the Gotham City FiveM server. It is not intended to create a legally enforceable real-world agreement.",
          50,
          footerY,
          { width: contentWidth - 16, height: 20, align: "center", lineGap: 1 },
        );
      doc
        .font("Helvetica")
        .fontSize(6)
        .text(`Page ${page + 1} of ${range.count}`, 42, doc.page.height - 24, {
          width: contentWidth,
          height: 10,
          align: "center",
          lineBreak: false,
        });
      doc.page.margins.bottom = previousBottomMargin;
    }
    doc.end();
  });
}

async function pdfBuffer(bundle) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
        size: "A4",
        margins: { top: 60, bottom: 65, left: 58, right: 58 },
        info: { Title: bundle.title, Author: "Gotham City" },
      }),
      chunks = [];
    doc.on("data", (d) => chunks.push(d));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const footer = () => {
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor("#555")
          .text(
            `This document and its electronic signatures are created exclusively for roleplay use within the Gotham City FiveM server. It is not intended to create a legally enforceable real-world agreement.  |  Page ${i + 1}`,
            58,
            doc.page.height - 45,
            { width: doc.page.width - 116, align: "center" },
          );
      }
    };
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#171717")
      .text("GOTHAM CITY", { align: "center" });
    doc.fontSize(14).text(bundle.title, { align: "center" });
    doc
      .moveDown(0.4)
      .font("Helvetica")
      .fontSize(9)
      .text(
        `${bundle.contract_number}  •  ${bundle.contract_type}  •  Version ${bundle.current_version}`,
        { align: "center" },
      );
    doc
      .moveDown()
      .fontSize(8)
      .fillColor("#555")
      .text(
        `Effective: ${bundle.effective_date || "Not specified"}   Status: ${bundle.status}   Jurisdiction: ${bundle.version.content.jurisdiction || "Gotham City"}`,
        { align: "center" },
      );
    doc.moveDown(1.5);
    for (const p of bundle.parties) {
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#171717")
        .text(
          `${p.party_position === "PARTY_A" ? "PARTY A" : "PARTY B"}: ${p.display_name}`,
        );
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(
          `${p.party_type}${p.registration_identifier ? ` • ID ${p.registration_identifier}` : ""}\nRepresentative: ${p.representative_name}${p.representative_role ? ` — ${p.representative_role}` : ""}`,
        );
      doc.moveDown();
    }
    for (const [key, label] of [
      ["introduction", "Agreement introduction"],
      ["purpose", "Purpose"],
      ["definitions", "Definitions"],
    ])
      if (bundle.version.content[key]) {
        doc.font("Helvetica-Bold").fontSize(11).text(label);
        doc
          .font("Helvetica")
          .fontSize(9)
          .text(String(bundle.version.content[key]), { lineGap: 2 });
        doc.moveDown();
      }
    for (const clause of bundle.clauses) {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`${clause.clause_number}. ${clause.title}`, { continued: false });
      doc.font("Helvetica").fontSize(9).text(clause.content, { lineGap: 2 });
      doc.moveDown(0.7);
    }
    doc.moveDown();
    doc.font("Helvetica-Bold").fontSize(11).text("SIGNATURES");
    for (const p of bundle.parties) {
      const s = bundle.signatures.find(
        (x) => String(x.party_id) === String(p.id),
      );
      doc
        .moveDown()
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(`${p.display_name} — ${p.representative_name}`);
      doc
        .font("Helvetica-Oblique")
        .fontSize(15)
        .text(
          s?.typed_signature ||
            (s?.signature_method === "drawn"
              ? "[Drawn signature recorded]"
              : "Not signed"),
        );
      doc
        .font("Helvetica")
        .fontSize(8)
        .text(
          s
            ? `Signed ${new Date(s.signed_at).toISOString()} UTC • Hash ${s.signed_document_hash.slice(0, 16)}`
            : "Unsigned",
        );
    }
    doc
      .moveDown()
      .font("Helvetica")
      .fontSize(7)
      .text(
        `Verification code: ${bundle.verification_code} • Document SHA-256: ${bundle.version.document_hash}`,
      );
    footer();
    doc.end();
  });
}
export async function generatePdf(id, actorId) {
  const pool = getPool(),
    c = await pool.getConnection();
  try {
    const b = await loadBundle(c, id);
    if (!b || !["Completed", "Archived"].includes(b.status))
      throw Object.assign(new Error("pdf_not_available"), { status: 409 });
    if (b.pdf?.storage_key?.endsWith("-r2")) return b.pdf;
    const buffer = await pdfBufferWebsite(b),
      fileHash = hash(buffer),
      uploaded = await uploadBufferToCloudinary(buffer, {
        folder: "gotham-city/contracts/final",
        publicId: `gotham-city-contract-${b.contract_number}-r2`,
        resourceType: "raw",
        type: "authenticated",
        accessMode: "authenticated",
        overwrite: true,
      });
    const row = {
      id: randomUUID(),
      contract: id,
      version: b.version.id,
      key: uploaded.publicId,
      url: uploaded.url,
      hash: fileHash,
      actor: actorId || null,
    };
    await q(
      c,
      `INSERT INTO contract_pdf_files (id,contract_id,contract_version_id,storage_key,file_url,file_hash,generated_by_user_id)
       VALUES (:id,:contract,:version,:key,:url,:hash,:actor)
       ON DUPLICATE KEY UPDATE storage_key=VALUES(storage_key),file_url=VALUES(file_url),file_hash=VALUES(file_hash),generated_at=NOW(),generated_by_user_id=VALUES(generated_by_user_id)`,
      row,
    );
    await audit(c, id, b.version.id, actorId, "pdf_generated", {
      file_hash: fileHash,
    });
    return {
      storage_key: uploaded.publicId,
      file_url: uploaded.url,
      file_hash: fileHash,
    };
  } finally {
    c.release();
  }
}

export async function verification(code) {
  const pool = getPool(),
    c = await pool.getConnection();
  try {
    const rows = await q(
      c,
      "SELECT id,contract_number,title,contract_type,status,current_version,completed_at FROM contracts WHERE verification_code=:code AND public_verification_enabled=1 LIMIT 1",
      { code: cleanText(code, 96) },
    );
    if (!rows[0]) return null;
    const v = (
      await q(
        c,
        "SELECT document_hash FROM contract_versions WHERE contract_id=:id AND version_number=:version LIMIT 1",
        { id: rows[0].id, version: rows[0].current_version },
      )
    )[0];
    const parties = await q(
      c,
      "SELECT display_name FROM contract_parties p JOIN contract_versions v ON v.id=p.contract_version_id WHERE p.contract_id=:id AND v.version_number=:version ORDER BY party_position",
      { id: rows[0].id, version: rows[0].current_version },
    );
    return {
      contract_number: rows[0].contract_number,
      title: rows[0].title,
      contract_type: rows[0].contract_type,
      status: rows[0].status,
      version: rows[0].current_version,
      completion_date: rows[0].completed_at,
      parties: parties.map((p) => p.display_name),
      fingerprint: v?.document_hash?.slice(0, 16) || null,
    };
  } finally {
    c.release();
  }
}

export const __contractTest = { publicContractView, contractImage };
