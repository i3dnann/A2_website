import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getPool } from "../config/db.js";
import { databaseEnabled } from "../config/env.js";
import { findUserByIdentifiers } from "./users.js";
import { safeJson, toBoolean } from "../utils/sanitize.js";

export const DEPARTMENTS = [
  {
    id: "dept-ems",
    slug: "ems",
    name: "EMS / Ambulance Department",
    short_name: "EMS",
    description: "Medical response, rescue coordination, and public care across Gotham City.",
    accent_style: "ems",
    is_published: true
  },
  {
    id: "dept-police",
    slug: "police",
    name: "Police Department",
    short_name: "Police",
    description: "Law enforcement, public safety, investigations, and city patrol operations.",
    accent_style: "police",
    is_published: true
  },
  {
    id: "dept-fib",
    slug: "fib",
    name: "FIB Department",
    short_name: "FIB",
    description: "Federal investigations, intelligence-led operations, and high-risk case coordination.",
    accent_style: "fib",
    is_published: true
  }
];

const memory = {
  ranks: [],
  wings: [],
  memberships: [],
  membershipWings: [],
  uniforms: [],
  vehicles: [],
  roles: [],
  audit: []
};

const statusValues = ["Active", "Off duty", "Leave of absence", "Suspended", "Retired"];
export const departmentRoleTypes = ["member", "management"];

export const employeeSchema = z.object({
  user_id: z.string().max(64).optional().nullable(),
  discord_user_id: z.string().max(32).optional().nullable(),
  discord_username: z.string().max(120).optional().nullable(),
  display_name: z.string().max(160).optional().nullable(),
  character_name: z.string().max(160).optional().nullable(),
  unit_code: z.string().max(40).optional().nullable(),
  rank_id: z.string().max(64).optional().nullable(),
  primary_wing_id: z.string().max(64).optional().nullable(),
  profile_image_url: z.string().max(1000).optional().nullable(),
  public_biography: z.string().max(3000).optional().nullable(),
  employment_status: z.enum(statusValues).optional(),
  display_order: z.coerce.number().int().min(0).max(999999).optional(),
  hired_at: z.string().max(40).optional().nullable(),
  wing_ids: z.array(z.string().max(64)).optional(),
  lookup: z.string().max(190).optional().nullable()
});

export const rankSchema = z.object({
  name: z.string().min(1).max(120),
  short_name: z.string().max(40).optional().nullable(),
  hierarchy_level: z.coerce.number().int().min(0).max(999999).optional(),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().max(1000).optional().nullable(),
  display_order: z.coerce.number().int().min(0).max(999999).optional(),
  is_active: z.coerce.boolean().optional()
});

export const wingSchema = z.object({
  name: z.string().min(1).max(120),
  short_code: z.string().max(40).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  image_url: z.string().max(1000).optional().nullable(),
  display_order: z.coerce.number().int().min(0).max(999999).optional(),
  is_active: z.coerce.boolean().optional()
});

export const uniformSchema = z.object({
  category: z.string().max(120).optional().nullable(),
  title: z.string().min(1).max(160),
  description: z.string().max(3000).optional().nullable(),
  image_url: z.string().max(1000).optional().nullable(),
  storage_key: z.string().max(255).optional().nullable(),
  gender: z.string().max(40).optional().nullable(),
  component_data: z.any().optional().nullable(),
  display_order: z.coerce.number().int().min(0).max(999999).optional(),
  is_published: z.coerce.boolean().optional()
});

export const vehicleSchema = z.object({
  name: z.string().min(1).max(160),
  model_code: z.string().max(80).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  description: z.string().max(3000).optional().nullable(),
  image_url: z.string().max(1000).optional().nullable(),
  storage_key: z.string().max(255).optional().nullable(),
  minimum_rank_id: z.string().max(64).optional().nullable(),
  required_wing_id: z.string().max(64).optional().nullable(),
  display_order: z.coerce.number().int().min(0).max(999999).optional(),
  is_published: z.coerce.boolean().optional()
});

function nowIso() {
  return new Date().toISOString();
}

function publicDepartment(row) {
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    description: row.description || "",
    logoUrl: row.logo_url || "",
    headerImageUrl: row.header_image_url || "",
    accentStyle: row.accent_style || row.slug,
    isPublished: toBoolean(row.is_published)
  };
}

function dbUnavailable() {
  return Object.assign(new Error("Department database tables are not ready. Run the latest migration first."), { status: 503, code: "department_database_not_ready" });
}

async function db(sql, params = {}) {
  if (!databaseEnabled) return null;
  const pool = getPool();
  if (!pool) return null;
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    throw dbUnavailable();
  }
}

function memList(key, departmentId, { publicOnly = false } = {}) {
  return memory[key]
    .filter((row) => row.department_id === departmentId && !row.deleted_at)
    .filter((row) => !publicOnly || (row.is_published === undefined ? row.is_active !== false : row.is_published !== false))
    .sort((a, b) => Number(a.display_order || 9999) - Number(b.display_order || 9999) || String(a.name || a.title || "").localeCompare(String(b.name || b.title || "")));
}

function roleFor(departmentSlug, type) {
  return `${departmentSlug}_${type}`;
}

export function isDepartmentRole(role) {
  return /^(ems|police|fib)_(member|management)$/.test(String(role || ""));
}

export function isSuperAdmin(user) {
  return Boolean(user?.permissions?.includes("master_access") || user?.roles?.includes("Master Admin"));
}

export async function listDepartments({ includeUnpublished = false } = {}) {
  if (databaseEnabled) {
    const rows = await db(
      `SELECT * FROM departments ${includeUnpublished ? "" : "WHERE is_published = 1"} ORDER BY FIELD(slug, 'ems', 'police', 'fib'), name`
    );
    return rows.map(publicDepartment);
  }
  return DEPARTMENTS.filter((department) => includeUnpublished || department.is_published).map(publicDepartment);
}

export async function getDepartmentBySlug(slug, { includeUnpublished = false } = {}) {
  const safeSlug = String(slug || "").trim().toLowerCase();
  if (databaseEnabled) {
    const rows = await db(
      `SELECT * FROM departments WHERE slug = :slug ${includeUnpublished ? "" : "AND is_published = 1"} LIMIT 1`,
      { slug: safeSlug }
    );
    if (rows[0]) return publicDepartment(rows[0]);
  } else {
    const found = DEPARTMENTS.find((department) => department.slug === safeSlug && (includeUnpublished || department.is_published));
    if (found) return publicDepartment(found);
  }
  throw Object.assign(new Error("department_not_found"), { status: 404 });
}

async function departmentRolesForUser(userId, departmentId) {
  if (!userId) return [];
  if (databaseEnabled) {
    const rows = await db(
      `SELECT role FROM department_role_assignments
       WHERE user_id = :user_id AND department_id = :department_id AND removed_at IS NULL`,
      { user_id: userId, department_id: departmentId }
    );
    return rows.map((row) => row.role);
  }
  return memory.roles
    .filter((row) => row.user_id === userId && row.department_id === departmentId && !row.removed_at)
    .map((row) => row.role);
}

export async function getDepartmentAccess(user, department) {
  if (!user) return { authenticated: false, roles: [], canViewMemberArea: false, canManage: false, canAssignManagement: false };
  if (isSuperAdmin(user)) {
    return {
      authenticated: true,
      roles: [roleFor(department.slug, "member"), roleFor(department.slug, "management")],
      canViewMemberArea: true,
      canManage: true,
      canAssignManagement: true
    };
  }
  const dbRoles = await departmentRolesForUser(user.id, department.id);
  const roles = [...new Set([...(user.roles || []).filter(isDepartmentRole), ...dbRoles])];
  const memberRole = roleFor(department.slug, "member");
  const managementRole = roleFor(department.slug, "management");
  const canManage = roles.includes(managementRole);
  return {
    authenticated: true,
    roles,
    canViewMemberArea: canManage || roles.includes(memberRole),
    canManage,
    canAssignManagement: false
  };
}

export async function assertDepartmentPermission(user, department, permission) {
  if (!user) throw Object.assign(new Error("login_required"), { status: 401 });
  const access = await getDepartmentAccess(user, department);
  const allowed =
    permission === "view_member" ? access.canViewMemberArea :
    permission === "assign_management" ? access.canAssignManagement :
    access.canManage;
  if (!allowed) {
    throw Object.assign(new Error("You are signed in, but you do not have permission to manage this department."), {
      status: 403,
      code: "department_permission_denied"
    });
  }
  return access;
}

function normalizeUnitCode(value) {
  const normalized = String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
  if (!normalized) return null;
  if (!/^[A-Z0-9][A-Z0-9 -]{0,38}[A-Z0-9]$/.test(normalized)) {
    throw Object.assign(new Error("Unit code can use letters, numbers, spaces, and hyphens."), { status: 422 });
  }
  return normalized;
}

function cleanString(value, fallback = null) {
  if (value === undefined) return undefined;
  const text = String(value || "").trim();
  return text || fallback;
}

function rowBooleans(row) {
  return {
    ...row,
    is_active: row.is_active === undefined ? undefined : toBoolean(row.is_active),
    is_published: row.is_published === undefined ? undefined : toBoolean(row.is_published),
    component_data: row.component_data ? safeJson(row.component_data, row.component_data) : null
  };
}

export async function listRanks(department, { includeInactive = false } = {}) {
  if (databaseEnabled) {
    const rows = await db(
      `SELECT * FROM department_ranks
       WHERE department_id = :department_id ${includeInactive ? "" : "AND is_active = 1"}
         AND deleted_at IS NULL
       ORDER BY display_order, hierarchy_level, name`,
      { department_id: department.id }
    );
    return rows.map(rowBooleans);
  }
  return memList("ranks", department.id, { publicOnly: !includeInactive });
}

export async function listWings(department, { includeInactive = false } = {}) {
  if (databaseEnabled) {
    const rows = await db(
      `SELECT * FROM department_wings
       WHERE department_id = :department_id ${includeInactive ? "" : "AND is_active = 1"}
         AND deleted_at IS NULL
       ORDER BY display_order, name`,
      { department_id: department.id }
    );
    return rows.map(rowBooleans);
  }
  return memList("wings", department.id, { publicOnly: !includeInactive });
}

export async function listUniforms(department, { includeUnpublished = false } = {}) {
  if (databaseEnabled) {
    const rows = await db(
      `SELECT * FROM department_uniforms
       WHERE department_id = :department_id AND deleted_at IS NULL ${includeUnpublished ? "" : "AND is_published = 1"}
       ORDER BY display_order, title`,
      { department_id: department.id }
    );
    return rows.map(rowBooleans);
  }
  return memList("uniforms", department.id, { publicOnly: !includeUnpublished });
}

export async function listVehicles(department, { includeUnpublished = false } = {}) {
  if (databaseEnabled) {
    const rows = await db(
      `SELECT v.*, r.name AS minimum_rank_name, w.name AS required_wing_name
       FROM department_vehicles v
       LEFT JOIN department_ranks r ON r.id = v.minimum_rank_id AND r.department_id = v.department_id
       LEFT JOIN department_wings w ON w.id = v.required_wing_id AND w.department_id = v.department_id
       WHERE v.department_id = :department_id AND v.deleted_at IS NULL ${includeUnpublished ? "" : "AND v.is_published = 1"}
       ORDER BY v.display_order, v.name`,
      { department_id: department.id }
    );
    return rows.map(rowBooleans);
  }
  return memList("vehicles", department.id, { publicOnly: !includeUnpublished });
}

export async function listEmployees(department, { includePrivate = false } = {}) {
  let rows;
  let wings;
  if (databaseEnabled) {
    rows = await db(
      `SELECT m.*,
              u.username AS account_username,
              u.avatar_url AS account_avatar_url,
              u.discord_id AS account_discord_id,
              u.discord_username AS account_discord_username,
              p.avatar_url AS discord_avatar_url,
              r.name AS rank_name,
              r.short_name AS rank_short_name,
              r.hierarchy_level AS rank_level,
              pw.name AS primary_wing_name,
              pw.short_code AS primary_wing_code
       FROM department_memberships m
       LEFT JOIN web_users u ON u.id = m.user_id AND u.deleted_at IS NULL
       LEFT JOIN web_auth_providers p ON p.user_id = m.user_id AND p.provider = 'discord'
       LEFT JOIN department_ranks r ON r.id = m.rank_id AND r.department_id = m.department_id
       LEFT JOIN department_wings pw ON pw.id = m.primary_wing_id AND pw.department_id = m.department_id
       WHERE m.department_id = :department_id AND m.deleted_at IS NULL
       ORDER BY m.display_order, COALESCE(m.unit_code, ''), COALESCE(m.character_name, m.display_name, u.username, m.discord_username, '')`,
      { department_id: department.id }
    );
    wings = await db(
      `SELECT mw.membership_id, w.id, w.name, w.short_code
       FROM department_membership_wings mw
       JOIN department_wings w ON w.id = mw.wing_id
       WHERE w.department_id = :department_id
       ORDER BY w.display_order, w.name`,
      { department_id: department.id }
    );
  } else {
    rows = memory.memberships.filter((row) => row.department_id === department.id && !row.deleted_at);
    wings = memory.membershipWings
      .map((link) => ({ ...link, ...memory.wings.find((wing) => wing.id === link.wing_id) }))
      .filter((row) => row.department_id === department.id);
  }

  const wingMap = new Map();
  wings.forEach((wing) => {
    wingMap.set(wing.membership_id, [...(wingMap.get(wing.membership_id) || []), { id: wing.id, name: wing.name, short_code: wing.short_code }]);
  });

  return rows.map((row) => {
    const avatar = row.profile_image_url || row.discord_avatar_url || row.account_avatar_url || "";
    const publicRow = {
      id: String(row.id),
      department_id: row.department_id,
      user_id: includePrivate ? row.user_id || "" : undefined,
      discord_user_id: row.discord_user_id || row.account_discord_id || "",
      discord_username: row.discord_username || row.account_discord_username || "",
      display_name: row.display_name || row.account_username || row.discord_username || "",
      character_name: row.character_name || "",
      profile_image_url: avatar,
      unit_code: row.unit_code || "",
      rank_id: row.rank_id || "",
      rank_name: row.rank_name || "",
      rank_short_name: row.rank_short_name || "",
      primary_wing_id: row.primary_wing_id || "",
      primary_wing_name: row.primary_wing_name || "",
      primary_wing_code: row.primary_wing_code || "",
      wings: wingMap.get(row.id) || [],
      employment_status: row.employment_status || "Active",
      public_biography: row.public_biography || "",
      display_order: Number(row.display_order || 9999),
      hired_at: row.hired_at || null,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null
    };
    return publicRow;
  });
}

async function assertRank(department, rankId) {
  if (!rankId) return null;
  const rows = databaseEnabled
    ? await db("SELECT id FROM department_ranks WHERE id = :id AND department_id = :department_id LIMIT 1", { id: rankId, department_id: department.id })
    : memory.ranks.filter((rank) => rank.id === rankId && rank.department_id === department.id);
  if (!rows[0]) throw Object.assign(new Error("Rank does not belong to this department."), { status: 422 });
  return rankId;
}

async function assertWing(department, wingId) {
  if (!wingId) return null;
  const rows = databaseEnabled
    ? await db("SELECT id FROM department_wings WHERE id = :id AND department_id = :department_id LIMIT 1", { id: wingId, department_id: department.id })
    : memory.wings.filter((wing) => wing.id === wingId && wing.department_id === department.id);
  if (!rows[0]) throw Object.assign(new Error("Wing does not belong to this department."), { status: 422 });
  return wingId;
}

async function assertUniqueUnitCode(department, unitCode, exceptId = "") {
  if (!unitCode) return;
  const rows = databaseEnabled
    ? await db(
        `SELECT id FROM department_memberships
         WHERE department_id = :department_id AND unit_code = :unit_code AND deleted_at IS NULL AND (:except_id = '' OR id <> :except_id)
         LIMIT 1`,
        { department_id: department.id, unit_code: unitCode, except_id: exceptId }
      )
    : memory.memberships.filter((row) => row.department_id === department.id && row.unit_code === unitCode && row.id !== exceptId && !row.deleted_at);
  if (rows[0]) throw Object.assign(new Error("That unit code is already used in this department."), { status: 409 });
}

export async function addDepartmentAudit({ department, actor, action, entityType, entityId, before = null, after = null }) {
  const entry = {
    id: randomUUID(),
    department_id: department.id,
    actor_user_id: actor?.id || null,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    before_data: before ? JSON.stringify(before).slice(0, 12000) : null,
    after_data: after ? JSON.stringify(after).slice(0, 12000) : null,
    created_at: nowIso()
  };
  if (databaseEnabled) {
    await db(
      `INSERT INTO department_audit_logs
       (id, department_id, actor_user_id, action, entity_type, entity_id, before_data, after_data)
       VALUES (:id, :department_id, :actor_user_id, :action, :entity_type, :entity_id, :before_data, :after_data)`,
      entry
    );
  } else {
    memory.audit.unshift(entry);
  }
  return entry;
}

export async function listAudit(department, { limit = 100 } = {}) {
  const safeLimit = Math.min(Number(limit) || 100, 250);
  if (databaseEnabled) {
    return db(
      `SELECT l.*, u.username AS actor_name
       FROM department_audit_logs l
       LEFT JOIN web_users u ON u.id = l.actor_user_id
       WHERE l.department_id = :department_id
       ORDER BY l.created_at DESC
       LIMIT ${safeLimit}`,
      { department_id: department.id }
    );
  }
  return memory.audit.filter((row) => row.department_id === department.id).slice(0, safeLimit);
}

async function resolveTargetUser(payload = {}) {
  const lookup = cleanString(payload.lookup);
  return findUserByIdentifiers({
    user_id: payload.user_id || lookup || "",
    discord_id: payload.discord_user_id || lookup || "",
    email: lookup || "",
    username: lookup || ""
  }).catch(() => null);
}

export async function createEmployee(department, payload, actor) {
  const body = employeeSchema.parse(payload || {});
  const user = await resolveTargetUser(body);
  const unitCode = normalizeUnitCode(body.unit_code);
  await assertUniqueUnitCode(department, unitCode);
  await assertRank(department, body.rank_id || null);
  await assertWing(department, body.primary_wing_id || null);
  const wingIds = [...new Set(body.wing_ids || [])];
  await Promise.all(wingIds.map((id) => assertWing(department, id)));

  const row = {
    id: randomUUID(),
    department_id: department.id,
    user_id: user?.id || cleanString(body.user_id),
    discord_user_id: cleanString(body.discord_user_id) || user?.discord_id || null,
    discord_username: cleanString(body.discord_username) || user?.discord_username || null,
    display_name: cleanString(body.display_name) || user?.username || body.discord_username || null,
    membership_role: "member",
    employment_status: body.employment_status || "Active",
    character_name: cleanString(body.character_name),
    unit_code: unitCode,
    rank_id: cleanString(body.rank_id),
    primary_wing_id: cleanString(body.primary_wing_id),
    profile_image_url: cleanString(body.profile_image_url) || user?.avatar_url || null,
    public_biography: cleanString(body.public_biography),
    display_order: body.display_order ?? 9999,
    hired_at: cleanString(body.hired_at),
    created_by: actor?.id || null,
    updated_by: actor?.id || null,
    created_at: nowIso(),
    updated_at: nowIso(),
    deleted_at: null
  };

  if (!row.user_id && !row.discord_user_id) {
    throw Object.assign(new Error("Add an existing user ID or Discord user ID."), { status: 422 });
  }

  const duplicate = databaseEnabled
    ? await db(
        `SELECT id FROM department_memberships
         WHERE department_id = :department_id
           AND deleted_at IS NULL
           AND ((:user_id <> '' AND user_id = :user_id) OR (:discord_user_id <> '' AND discord_user_id = :discord_user_id))
         LIMIT 1`,
        { department_id: department.id, user_id: row.user_id || "", discord_user_id: row.discord_user_id || "" }
      )
    : memory.memberships.filter((item) => item.department_id === department.id && !item.deleted_at && ((row.user_id && item.user_id === row.user_id) || (row.discord_user_id && item.discord_user_id === row.discord_user_id)));
  if (duplicate[0]) throw Object.assign(new Error("This person is already in this department."), { status: 409 });

  if (databaseEnabled) {
    await db(
      `INSERT INTO department_memberships
       (id, department_id, user_id, discord_user_id, discord_username, display_name, membership_role, employment_status, character_name, unit_code, rank_id, primary_wing_id, profile_image_url, public_biography, display_order, hired_at, created_by, updated_by)
       VALUES
       (:id, :department_id, :user_id, :discord_user_id, :discord_username, :display_name, :membership_role, :employment_status, :character_name, :unit_code, :rank_id, :primary_wing_id, :profile_image_url, :public_biography, :display_order, :hired_at, :created_by, :updated_by)`,
      row
    );
    await Promise.all(wingIds.map((wing_id) => db(
      "INSERT IGNORE INTO department_membership_wings (membership_id, wing_id) VALUES (:membership_id, :wing_id)",
      { membership_id: row.id, wing_id }
    )));
  } else {
    memory.memberships.push(row);
    wingIds.forEach((wing_id) => memory.membershipWings.push({ membership_id: row.id, wing_id, created_at: nowIso() }));
  }

  if (row.user_id) await grantDepartmentRole(department, row.user_id, "member", actor, { silentIfExists: true });
  await addDepartmentAudit({ department, actor, action: "employee_created", entityType: "department_membership", entityId: row.id, after: row });
  return (await listEmployees(department, { includePrivate: true })).find((employee) => employee.id === row.id);
}

async function getEmployeeRow(department, id) {
  if (databaseEnabled) {
    const rows = await db("SELECT * FROM department_memberships WHERE id = :id AND department_id = :department_id AND deleted_at IS NULL LIMIT 1", { id, department_id: department.id });
    return rows[0] || null;
  }
  return memory.memberships.find((row) => row.id === id && row.department_id === department.id && !row.deleted_at) || null;
}

export async function updateEmployee(department, id, payload, actor) {
  const before = await getEmployeeRow(department, id);
  if (!before) throw Object.assign(new Error("employee_not_found"), { status: 404 });
  const body = employeeSchema.partial().parse(payload || {});
  const patch = {};
  for (const key of ["discord_user_id", "discord_username", "display_name", "character_name", "profile_image_url", "public_biography", "employment_status", "hired_at"]) {
    if (body[key] !== undefined) patch[key] = cleanString(body[key]);
  }
  if (body.unit_code !== undefined) {
    patch.unit_code = normalizeUnitCode(body.unit_code);
    await assertUniqueUnitCode(department, patch.unit_code, id);
  }
  if (body.rank_id !== undefined) {
    patch.rank_id = cleanString(body.rank_id);
    await assertRank(department, patch.rank_id);
  }
  if (body.primary_wing_id !== undefined) {
    patch.primary_wing_id = cleanString(body.primary_wing_id);
    await assertWing(department, patch.primary_wing_id);
  }
  if (body.display_order !== undefined) patch.display_order = body.display_order;
  patch.updated_by = actor?.id || null;
  patch.updated_at = nowIso();

  const wingIds = body.wing_ids ? [...new Set(body.wing_ids)] : null;
  if (wingIds) await Promise.all(wingIds.map((wingId) => assertWing(department, wingId)));

  if (databaseEnabled) {
    const keys = Object.keys(patch);
    if (keys.length) {
      await db(`UPDATE department_memberships SET ${keys.map((key) => `${key} = :${key}`).join(", ")} WHERE id = :id AND department_id = :department_id`, { ...patch, id, department_id: department.id });
    }
    if (wingIds) {
      await db("DELETE FROM department_membership_wings WHERE membership_id = :id", { id });
      await Promise.all(wingIds.map((wing_id) => db(
        "INSERT IGNORE INTO department_membership_wings (membership_id, wing_id) VALUES (:membership_id, :wing_id)",
        { membership_id: id, wing_id }
      )));
    }
  } else {
    Object.assign(before, patch);
    if (wingIds) {
      memory.membershipWings = memory.membershipWings.filter((row) => row.membership_id !== id);
      wingIds.forEach((wing_id) => memory.membershipWings.push({ membership_id: id, wing_id, created_at: nowIso() }));
    }
  }

  const after = await getEmployeeRow(department, id);
  await addDepartmentAudit({ department, actor, action: "employee_updated", entityType: "department_membership", entityId: id, before, after });
  return (await listEmployees(department, { includePrivate: true })).find((employee) => employee.id === id);
}

export async function removeEmployee(department, id, actor) {
  const before = await getEmployeeRow(department, id);
  if (!before) throw Object.assign(new Error("employee_not_found"), { status: 404 });
  const patch = { employment_status: "Retired", unit_code: null, deleted_at: nowIso(), updated_by: actor?.id || null, updated_at: nowIso() };
  if (databaseEnabled) {
    await db("UPDATE department_memberships SET employment_status = :employment_status, unit_code = NULL, deleted_at = :deleted_at, updated_by = :updated_by, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND department_id = :department_id", { ...patch, id, department_id: department.id });
  } else {
    Object.assign(before, patch);
  }
  if (before.user_id) await removeDepartmentRole(department, before.user_id, "member", actor, { silentIfMissing: true });
  await addDepartmentAudit({ department, actor, action: "employee_retired", entityType: "department_membership", entityId: id, before, after: patch });
  return { ok: true };
}

async function crudCreate(tableKey, tableName, department, payload, actor, action) {
  const row = { id: randomUUID(), department_id: department.id, ...payload, created_by: actor?.id || null, updated_by: actor?.id || null, created_at: nowIso(), updated_at: nowIso(), deleted_at: null };
  if (databaseEnabled) {
    const keys = Object.keys(row).filter((key) => row[key] !== undefined);
    await db(`INSERT INTO ${tableName} (${keys.join(", ")}) VALUES (${keys.map((key) => `:${key}`).join(", ")})`, Object.fromEntries(keys.map((key) => [key, typeof row[key] === "object" && row[key] !== null ? JSON.stringify(row[key]) : row[key]])));
  } else {
    memory[tableKey].push(row);
  }
  await addDepartmentAudit({ department, actor, action, entityType: tableName, entityId: row.id, after: row });
  return rowBooleans(row);
}

async function crudUpdate(tableKey, tableName, department, id, payload, actor, action) {
  const before = databaseEnabled
    ? (await db(`SELECT * FROM ${tableName} WHERE id = :id AND department_id = :department_id ${["department_ranks", "department_wings"].includes(tableName) ? "" : "AND deleted_at IS NULL"} LIMIT 1`, { id, department_id: department.id }))[0]
    : memory[tableKey].find((row) => row.id === id && row.department_id === department.id && !row.deleted_at);
  if (!before) throw Object.assign(new Error("item_not_found"), { status: 404 });
  const patch = { ...payload, updated_by: actor?.id || null, updated_at: nowIso() };
  if (databaseEnabled) {
    const keys = Object.keys(patch).filter((key) => patch[key] !== undefined);
    await db(`UPDATE ${tableName} SET ${keys.map((key) => `${key} = :${key}`).join(", ")} WHERE id = :id AND department_id = :department_id`, Object.fromEntries([...keys.map((key) => [key, typeof patch[key] === "object" && patch[key] !== null ? JSON.stringify(patch[key]) : patch[key]]), ["id", id], ["department_id", department.id]]));
  } else {
    Object.assign(before, patch);
  }
  await addDepartmentAudit({ department, actor, action, entityType: tableName, entityId: id, before, after: { ...before, ...patch } });
  return rowBooleans({ ...before, ...patch });
}

async function crudDelete(tableKey, tableName, department, id, actor, action) {
  const before = databaseEnabled
    ? (await db(`SELECT * FROM ${tableName} WHERE id = :id AND department_id = :department_id LIMIT 1`, { id, department_id: department.id }))[0]
    : memory[tableKey].find((row) => row.id === id && row.department_id === department.id && !row.deleted_at);
  if (!before) throw Object.assign(new Error("item_not_found"), { status: 404 });
  if (databaseEnabled) {
    if (["department_ranks", "department_wings"].includes(tableName)) {
      await db(`DELETE FROM ${tableName} WHERE id = :id AND department_id = :department_id`, { id, department_id: department.id });
    } else {
      await db(`UPDATE ${tableName} SET deleted_at = CURRENT_TIMESTAMP, updated_by = :updated_by WHERE id = :id AND department_id = :department_id`, { id, department_id: department.id, updated_by: actor?.id || null });
    }
  } else {
    if (["ranks", "wings"].includes(tableKey)) memory[tableKey] = memory[tableKey].filter((row) => row.id !== id);
    else before.deleted_at = nowIso();
  }
  await addDepartmentAudit({ department, actor, action, entityType: tableName, entityId: id, before });
  return before;
}

export async function createRank(department, payload, actor) {
  const body = rankSchema.parse(payload || {});
  return crudCreate("ranks", "department_ranks", department, {
    ...body,
    short_name: cleanString(body.short_name),
    description: cleanString(body.description),
    image_url: cleanString(body.image_url),
    hierarchy_level: body.hierarchy_level ?? 0,
    display_order: body.display_order ?? 9999,
    is_active: body.is_active === undefined ? 1 : body.is_active ? 1 : 0
  }, actor, "rank_created");
}

export async function updateRank(department, id, payload, actor) {
  const body = rankSchema.partial().parse(payload || {});
  return crudUpdate("ranks", "department_ranks", department, id, { ...body, is_active: body.is_active === undefined ? undefined : body.is_active ? 1 : 0 }, actor, "rank_updated");
}

export async function deleteRank(department, id, actor) {
  const used = databaseEnabled
    ? await db("SELECT id FROM department_memberships WHERE rank_id = :id AND department_id = :department_id AND deleted_at IS NULL LIMIT 1", { id, department_id: department.id })
    : memory.memberships.filter((row) => row.rank_id === id && row.department_id === department.id && !row.deleted_at);
  if (used[0]) throw Object.assign(new Error("Move employees off this rank before deleting it."), { status: 409 });
  return crudDelete("ranks", "department_ranks", department, id, actor, "rank_deleted");
}

export async function createWing(department, payload, actor) {
  const body = wingSchema.parse(payload || {});
  return crudCreate("wings", "department_wings", department, {
    ...body,
    short_code: cleanString(body.short_code),
    description: cleanString(body.description),
    image_url: cleanString(body.image_url),
    display_order: body.display_order ?? 9999,
    is_active: body.is_active === undefined ? 1 : body.is_active ? 1 : 0
  }, actor, "wing_created");
}

export async function updateWing(department, id, payload, actor) {
  const body = wingSchema.partial().parse(payload || {});
  return crudUpdate("wings", "department_wings", department, id, { ...body, is_active: body.is_active === undefined ? undefined : body.is_active ? 1 : 0 }, actor, "wing_updated");
}

export async function deleteWing(department, id, actor) {
  const used = databaseEnabled
    ? await db(
        `SELECT m.id FROM department_memberships m
         LEFT JOIN department_membership_wings mw ON mw.membership_id = m.id
         WHERE m.department_id = :department_id AND m.deleted_at IS NULL AND (m.primary_wing_id = :id OR mw.wing_id = :id)
         LIMIT 1`,
        { id, department_id: department.id }
      )
    : memory.memberships.filter((row) => row.department_id === department.id && !row.deleted_at && (row.primary_wing_id === id || memory.membershipWings.some((link) => link.membership_id === row.id && link.wing_id === id)));
  if (used[0]) throw Object.assign(new Error("Remove this wing from employees before deleting it."), { status: 409 });
  return crudDelete("wings", "department_wings", department, id, actor, "wing_deleted");
}

export async function createUniform(department, payload, actor) {
  const body = uniformSchema.parse(payload || {});
  return crudCreate("uniforms", "department_uniforms", department, {
    ...body,
    category: cleanString(body.category),
    description: cleanString(body.description),
    image_url: cleanString(body.image_url),
    storage_key: cleanString(body.storage_key),
    gender: cleanString(body.gender),
    display_order: body.display_order ?? 9999,
    is_published: body.is_published === undefined ? 1 : body.is_published ? 1 : 0
  }, actor, "uniform_created");
}

export async function updateUniform(department, id, payload, actor) {
  const body = uniformSchema.partial().parse(payload || {});
  return crudUpdate("uniforms", "department_uniforms", department, id, { ...body, is_published: body.is_published === undefined ? undefined : body.is_published ? 1 : 0 }, actor, "uniform_updated");
}

export async function deleteUniform(department, id, actor) {
  return crudDelete("uniforms", "department_uniforms", department, id, actor, "uniform_deleted");
}

export async function createVehicle(department, payload, actor) {
  const body = vehicleSchema.parse(payload || {});
  await assertRank(department, body.minimum_rank_id || null);
  await assertWing(department, body.required_wing_id || null);
  return crudCreate("vehicles", "department_vehicles", department, {
    ...body,
    model_code: cleanString(body.model_code),
    category: cleanString(body.category),
    description: cleanString(body.description),
    image_url: cleanString(body.image_url),
    storage_key: cleanString(body.storage_key),
    minimum_rank_id: cleanString(body.minimum_rank_id),
    required_wing_id: cleanString(body.required_wing_id),
    display_order: body.display_order ?? 9999,
    is_published: body.is_published === undefined ? 1 : body.is_published ? 1 : 0
  }, actor, "vehicle_created");
}

export async function updateVehicle(department, id, payload, actor) {
  const body = vehicleSchema.partial().parse(payload || {});
  if (body.minimum_rank_id !== undefined) await assertRank(department, body.minimum_rank_id || null);
  if (body.required_wing_id !== undefined) await assertWing(department, body.required_wing_id || null);
  return crudUpdate("vehicles", "department_vehicles", department, id, { ...body, is_published: body.is_published === undefined ? undefined : body.is_published ? 1 : 0 }, actor, "vehicle_updated");
}

export async function deleteVehicle(department, id, actor) {
  return crudDelete("vehicles", "department_vehicles", department, id, actor, "vehicle_deleted");
}

export async function grantDepartmentRole(department, userId, type, actor, { silentIfExists = false } = {}) {
  if (!departmentRoleTypes.includes(type)) throw Object.assign(new Error("invalid_department_role"), { status: 422 });
  if (String(userId) === String(actor?.id)) throw Object.assign(new Error("You cannot assign department roles to yourself."), { status: 403 });
  const role = roleFor(department.slug, type);
  if (databaseEnabled) {
    const existing = await db(
      "SELECT id FROM department_role_assignments WHERE user_id = :user_id AND department_id = :department_id AND role = :role AND removed_at IS NULL LIMIT 1",
      { user_id: userId, department_id: department.id, role }
    );
    if (existing[0]) {
      if (silentIfExists) return { ok: true, role };
      throw Object.assign(new Error("This role is already active."), { status: 409 });
    }
    await db(
      "INSERT INTO department_role_assignments (id, user_id, department_id, role, assigned_by) VALUES (:id, :user_id, :department_id, :role, :assigned_by)",
      { id: randomUUID(), user_id: userId, department_id: department.id, role, assigned_by: actor?.id || null }
    );
  } else {
    const existing = memory.roles.find((row) => row.user_id === userId && row.department_id === department.id && row.role === role && !row.removed_at);
    if (existing) {
      if (silentIfExists) return { ok: true, role };
      throw Object.assign(new Error("This role is already active."), { status: 409 });
    }
    memory.roles.push({ id: randomUUID(), user_id: userId, department_id: department.id, role, assigned_by: actor?.id || null, assigned_at: nowIso(), removed_at: null });
  }
  await addDepartmentAudit({ department, actor, action: type === "management" ? "management_role_granted" : "member_role_granted", entityType: "department_role_assignment", entityId: userId, after: { user_id: userId, role } });
  return { ok: true, role };
}

export async function removeDepartmentRole(department, userId, type, actor, { silentIfMissing = false } = {}) {
  if (!departmentRoleTypes.includes(type)) throw Object.assign(new Error("invalid_department_role"), { status: 422 });
  if (String(userId) === String(actor?.id)) throw Object.assign(new Error("You cannot remove department roles from yourself."), { status: 403 });
  const role = roleFor(department.slug, type);
  let changed = false;
  if (databaseEnabled) {
    const result = await db(
      `UPDATE department_role_assignments
       SET removed_by = :removed_by, removed_at = CURRENT_TIMESTAMP
       WHERE user_id = :user_id AND department_id = :department_id AND role = :role AND removed_at IS NULL`,
      { removed_by: actor?.id || null, user_id: userId, department_id: department.id, role }
    );
    changed = Number(result?.affectedRows || 0) > 0;
  } else {
    const found = memory.roles.find((row) => row.user_id === userId && row.department_id === department.id && row.role === role && !row.removed_at);
    if (found) {
      found.removed_by = actor?.id || null;
      found.removed_at = nowIso();
      changed = true;
    }
  }
  if (!changed && !silentIfMissing) throw Object.assign(new Error("Role assignment not found."), { status: 404 });
  if (changed) await addDepartmentAudit({ department, actor, action: type === "management" ? "management_role_removed" : "member_role_removed", entityType: "department_role_assignment", entityId: userId, before: { user_id: userId, role } });
  return { ok: true, role };
}

export async function searchDepartmentUsers(q) {
  const user = await findUserByIdentifiers({
    user_id: q,
    discord_id: q,
    steam_id: q,
    email: q,
    username: q
  }).catch(() => null);
  if (!user) return [];
  return [{
    id: user.id,
    username: user.username,
    avatar_url: user.avatar_url || "",
    discord_id: user.discord_id || "",
    discord_username: user.discord_username || "",
    steam_id: user.steam_id || ""
  }];
}
