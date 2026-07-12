import test from "node:test";
import assert from "node:assert/strict";
import {
  assertDepartmentPermission,
  getDepartmentAccess,
  getDepartmentBySlug,
  grantDepartmentRole,
  removeDepartmentRole
} from "./departments.js";

const master = {
  id: "test-master",
  roles: ["Master Admin"],
  permissions: ["master_access"]
};

const emsManager = {
  id: "test-ems-manager",
  roles: [],
  permissions: []
};

const emsMember = {
  id: "test-ems-member",
  roles: [],
  permissions: []
};

test("public visitors can view department pages but cannot manage", async () => {
  const ems = await getDepartmentBySlug("ems");
  const access = await getDepartmentAccess(null, ems);
  assert.equal(access.authenticated, false);
  assert.equal(access.canViewMemberArea, false);
  assert.equal(access.canManage, false);
});

test("master admin can manage every department", async () => {
  for (const slug of ["ems", "police", "fib"]) {
    const department = await getDepartmentBySlug(slug);
    const access = await getDepartmentAccess(master, department);
    assert.equal(access.canManage, true);
    assert.equal(access.canAssignManagement, true);
  }
});

test("department management is scoped to its department", async () => {
  const ems = await getDepartmentBySlug("ems");
  const police = await getDepartmentBySlug("police");
  await grantDepartmentRole(ems, emsManager.id, "management", master, { silentIfExists: true });

  const emsAccess = await getDepartmentAccess(emsManager, ems);
  const policeAccess = await getDepartmentAccess(emsManager, police);

  assert.equal(emsAccess.canManage, true);
  assert.equal(emsAccess.canViewMemberArea, true);
  assert.equal(policeAccess.canManage, false);
  assert.equal(policeAccess.canViewMemberArea, false);
});

test("members can view member area but cannot manage", async () => {
  const ems = await getDepartmentBySlug("ems");
  await grantDepartmentRole(ems, emsMember.id, "member", master, { silentIfExists: true });

  const access = await getDepartmentAccess(emsMember, ems);
  assert.equal(access.canViewMemberArea, true);
  assert.equal(access.canManage, false);
});

test("department managers cannot grant management roles", async () => {
  const ems = await getDepartmentBySlug("ems");
  await assert.rejects(
    () => assertDepartmentPermission(emsManager, ems, "assign_management"),
    /permission/
  );
});

test("users cannot assign roles to themselves", async () => {
  const fib = await getDepartmentBySlug("fib");
  await assert.rejects(
    () => grantDepartmentRole(fib, emsManager.id, "member", emsManager),
    /yourself/
  );
});

test("removed roles lose access in the next permission check", async () => {
  const ems = await getDepartmentBySlug("ems");
  await removeDepartmentRole(ems, emsMember.id, "member", master, { silentIfMissing: true });
  const access = await getDepartmentAccess(emsMember, ems);
  assert.equal(access.canViewMemberArea, false);
  assert.equal(access.canManage, false);
});
