import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/security.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinaryService.js";
import {
  assertDepartmentPermission,
  createEmployee,
  createRank,
  createUniform,
  createVehicle,
  createWing,
  deleteRank,
  deleteUniform,
  deleteVehicle,
  deleteWing,
  getDepartmentAccess,
  getDepartmentBySlug,
  grantDepartmentRole,
  isSuperAdmin,
  listAudit,
  listDepartments,
  listEmployees,
  listRanks,
  listUniforms,
  listVehicles,
  listWings,
  removeDepartmentRole,
  searchDepartmentUsers,
  updateEmployee,
  updateRank,
  updateUniform,
  updateVehicle,
  updateWing,
  removeEmployee
} from "../services/departments.js";

const router = Router();

function booleanFromForm(value) {
  if (value === undefined) return undefined;
  if (value === true || value === false) return value;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function bodyFromRequest(req) {
  const body = { ...(req.body || {}) };
  for (const key of ["is_active", "is_published"]) {
    if (key in body) body[key] = booleanFromForm(body[key]);
  }
  if (typeof body.wing_ids === "string") {
    body.wing_ids = body.wing_ids.split(",").map((value) => value.trim()).filter(Boolean);
  }
  if (typeof body.component_data === "string" && body.component_data.trim()) {
    try {
      body.component_data = JSON.parse(body.component_data);
    } catch {
      body.component_data = { raw: body.component_data };
    }
  }
  return body;
}

function requireImageFile(req, res, next) {
  if (req.file && !String(req.file.mimetype || "").startsWith("image/")) return res.status(400).json({ error: "only_images_allowed", message: "Upload a valid image file." });
  next();
}

async function departmentFromReq(req, { includeUnpublished = false } = {}) {
  return getDepartmentBySlug(req.params.department, { includeUnpublished });
}

async function uploadDepartmentImage(req, department, folder) {
  if (!req.file) return null;
  const uploaded = await uploadToCloudinary(req.file, `gotham-city/departments/${department.slug}/${folder}`);
  return { image_url: uploaded.url, storage_key: uploaded.publicId };
}

function handleDepartmentError(error, _req, res, next) {
  if (!error?.status) return next(error);
  const payload = {
    error: error.code || error.message || "department_request_failed",
    message: error.status === 403 ? "You are signed in, but you do not have permission to manage this department." : error.message
  };
  res.status(error.status).json(payload);
}

router.get("/", asyncHandler(async (req, res) => {
  const includeUnpublished = Boolean(req.user && isSuperAdmin(req.user));
  res.json({ departments: await listDepartments({ includeUnpublished }) });
}));

router.get("/:department", asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: Boolean(req.user && isSuperAdmin(req.user)) });
  res.json({ department });
}));

router.get("/:department/access", asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  res.json({ access: await getDepartmentAccess(req.user, department) });
}));

router.get("/:department/employees", asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req);
  res.json({ employees: await listEmployees(department) });
}));

router.get("/:department/ranks", asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req);
  const access = req.user ? await getDepartmentAccess(req.user, department) : null;
  res.json({ ranks: await listRanks(department, { includeInactive: Boolean(access?.canManage) }) });
}));

router.get("/:department/wings", asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req);
  const access = req.user ? await getDepartmentAccess(req.user, department) : null;
  res.json({ wings: await listWings(department, { includeInactive: Boolean(access?.canManage) }) });
}));

router.get("/:department/uniforms", asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req);
  const access = req.user ? await getDepartmentAccess(req.user, department) : null;
  res.json({ uniforms: await listUniforms(department, { includeUnpublished: Boolean(access?.canManage) }) });
}));

router.get("/:department/vehicles", asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req);
  const access = req.user ? await getDepartmentAccess(req.user, department) : null;
  res.json({ vehicles: await listVehicles(department, { includeUnpublished: Boolean(access?.canManage) }) });
}));

router.get("/:department/audit-log", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  res.json({ logs: await listAudit(department, { limit: req.query.limit || 100 }) });
}));

router.get("/:department/users/search", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ users: [] });
  res.json({ users: await searchDepartmentUsers(q) });
}));

router.post("/:department/employees", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const employee = await createEmployee(department, bodyFromRequest(req), req.user);
  res.status(201).json({ employee });
}));

router.patch("/:department/employees/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const employee = await updateEmployee(department, req.params.id, bodyFromRequest(req), req.user);
  res.json({ employee });
}));

router.delete("/:department/employees/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  res.json(await removeEmployee(department, req.params.id, req.user));
}));

router.post("/:department/roles/member", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const userId = String(req.body?.user_id || req.body?.userId || "").trim();
  if (!userId) return res.status(422).json({ error: "user_id_required", message: "Select a website user first." });
  res.status(201).json(await grantDepartmentRole(department, userId, "member", req.user));
}));

router.delete("/:department/roles/member/:userId", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  res.json(await removeDepartmentRole(department, req.params.userId, "member", req.user));
}));

router.post("/:department/roles/management", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "assign_management");
  const userId = String(req.body?.user_id || req.body?.userId || "").trim();
  if (!userId) return res.status(422).json({ error: "user_id_required", message: "Select a website user first." });
  res.status(201).json(await grantDepartmentRole(department, userId, "management", req.user));
}));

router.delete("/:department/roles/management/:userId", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "assign_management");
  res.json(await removeDepartmentRole(department, req.params.userId, "management", req.user));
}));

router.post("/:department/ranks", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  res.status(201).json({ rank: await createRank(department, bodyFromRequest(req), req.user) });
}));

router.patch("/:department/ranks/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  res.json({ rank: await updateRank(department, req.params.id, bodyFromRequest(req), req.user) });
}));

router.delete("/:department/ranks/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const before = await deleteRank(department, req.params.id, req.user);
  res.json({ ok: true, before });
}));

router.post("/:department/wings", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  res.status(201).json({ wing: await createWing(department, bodyFromRequest(req), req.user) });
}));

router.patch("/:department/wings/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  res.json({ wing: await updateWing(department, req.params.id, bodyFromRequest(req), req.user) });
}));

router.delete("/:department/wings/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const before = await deleteWing(department, req.params.id, req.user);
  res.json({ ok: true, before });
}));

router.post("/:department/uniforms", requireAuth, upload.single("file"), requireImageFile, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const media = await uploadDepartmentImage(req, department, "uniforms");
  const uniform = await createUniform(department, { ...bodyFromRequest(req), ...media }, req.user);
  res.status(201).json({ uniform });
}));

router.patch("/:department/uniforms/:id", requireAuth, upload.single("file"), requireImageFile, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const media = await uploadDepartmentImage(req, department, "uniforms");
  res.json({ uniform: await updateUniform(department, req.params.id, { ...bodyFromRequest(req), ...media }, req.user) });
}));

router.delete("/:department/uniforms/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const before = await deleteUniform(department, req.params.id, req.user);
  if (before?.storage_key) await deleteFromCloudinary(before.storage_key, "image/png");
  res.json({ ok: true });
}));

router.post("/:department/vehicles", requireAuth, upload.single("file"), requireImageFile, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const media = await uploadDepartmentImage(req, department, "vehicles");
  const vehicle = await createVehicle(department, { ...bodyFromRequest(req), ...media }, req.user);
  res.status(201).json({ vehicle });
}));

router.patch("/:department/vehicles/:id", requireAuth, upload.single("file"), requireImageFile, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const media = await uploadDepartmentImage(req, department, "vehicles");
  res.json({ vehicle: await updateVehicle(department, req.params.id, { ...bodyFromRequest(req), ...media }, req.user) });
}));

router.delete("/:department/vehicles/:id", requireAuth, asyncHandler(async (req, res) => {
  const department = await departmentFromReq(req, { includeUnpublished: true });
  await assertDepartmentPermission(req.user, department, "manage");
  const before = await deleteVehicle(department, req.params.id, req.user);
  if (before?.storage_key) await deleteFromCloudinary(before.storage_key, "image/png");
  res.json({ ok: true });
}));

router.use(handleDepartmentError);

export default router;
