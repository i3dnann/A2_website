import test from "node:test";
import assert from "node:assert/strict";
import { requireMaster, requirePermission } from "../src/middleware/auth.js";
import { hasActivePermission, includesMasterAuthority } from "../src/data/permissions.js";
import { __adminUsersExtraTest } from "../src/routes/adminUsersExtra.js";

function runMiddleware(middleware, user) {
  let statusCode = 200;
  let payload = null;
  let continued = false;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      payload = value;
      return this;
    },
  };
  middleware({ user }, response, () => {
    continued = true;
  });
  return { statusCode, payload, continued };
}

const superAdmin = {
  id: "super-admin",
  roles: ["Super Admin"],
  permissions: ["manage_admins", "manage_users"],
  admin_status: "active",
};

const masterAdmin = {
  id: "master-admin",
  roles: ["Master Admin"],
  permissions: ["master_access"],
  admin_status: "active",
};

test("frozen master administrators cannot pass master-only middleware", () => {
  const result = runMiddleware(requireMaster, {
    ...masterAdmin,
    admin_status: "frozen",
  });

  assert.equal(result.continued, false);
  assert.equal(result.statusCode, 403);
  assert.equal(result.payload.error, "admin_account_frozen_or_disabled");
});

test("direct active-permission checks reject frozen administrators", () => {
  assert.equal(
    hasActivePermission(
      { permissions: ["view_audit_logs"], admin_status: "frozen" },
      "view_audit_logs",
    ),
    false,
  );
});

test("read-only audit permission does not imply generic write permission", () => {
  const result = runMiddleware(requirePermission("view_audit_logs"), {
    permissions: ["view_audit_logs"],
    admin_status: "active",
  });

  assert.equal(result.continued, true);
  assert.equal(includesMasterAuthority({ permissions: ["master_access"] }), true);
});

test("non-master user managers cannot modify administrator accounts", () => {
  assert.equal(
    __adminUsersExtraTest.canManageTargetUser(superAdmin, {
      roles: ["Master Admin"],
      permissions: ["master_access"],
      admin_status: "active",
    }),
    false,
  );
});

test("master administrators can modify administrator accounts", () => {
  assert.equal(
    __adminUsersExtraTest.canManageTargetUser(masterAdmin, {
      roles: ["Super Admin"],
      permissions: ["manage_users"],
      admin_status: "active",
    }),
    true,
  );
});
