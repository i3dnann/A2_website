export const PERMISSIONS = [
  "manage_home",
  "manage_partners",
  "manage_journey",
  "manage_famous",
  "manage_roster",
  "manage_live",
  "manage_team",
  "manage_gallery",
  "manage_careers",
  "review_career_applications",
  "manage_tickets",
  "close_tickets",
  "manage_news",
  "manage_map",
  "manage_faq",
  "manage_terms",
  "manage_events",
  "manage_users",
  "manage_admins",
  "manage_permissions",
  "manage_theme",
  "manage_webhooks",
  "manage_files",
  "manage_contracts",
  "view_audit_logs",
  "master_access",
  "view_player_portal"
];

export const ADMIN_PERMISSIONS = PERMISSIONS.filter((permission) => permission !== "view_player_portal");

export const ROLES = [
  "Player",
  "Support",
  "Moderator",
  "Admin",
  "Super Admin",
  "Master Admin"
];

export const DEFAULT_ROLE_PERMISSIONS = {
  Player: ["view_player_portal"],
  Support: ["view_player_portal", "manage_tickets", "close_tickets", "review_career_applications"],
  Moderator: [
    "view_player_portal",
    "manage_tickets",
    "close_tickets",
    "review_career_applications",
    "manage_roster",
    "manage_faq",
    "view_audit_logs"
  ],
  Admin: [
    "view_player_portal",
    "manage_home",
    "manage_partners",
    "manage_journey",
    "manage_famous",
    "manage_roster",
    "manage_live",
    "manage_team",
    "manage_gallery",
    "manage_careers",
    "review_career_applications",
    "manage_tickets",
    "close_tickets",
    "manage_news",
    "manage_map",
    "manage_faq",
    "manage_terms",
    "manage_events",
    "manage_users",
    "manage_theme",
    "manage_webhooks",
    "manage_files",
    "manage_contracts",
    "view_audit_logs"
  ],
  "Super Admin": PERMISSIONS.filter((permission) => permission !== "master_access"),
  "Master Admin": PERMISSIONS
};

export function permissionsForRoles(roles = []) {
  return [...new Set(roles.flatMap((role) => DEFAULT_ROLE_PERMISSIONS[role] || []))];
}

export function hasPermission(user, permission) {
  const permissions = user?.permissions || [];
  return permissions.includes("master_access") || permissions.includes(permission);
}

export function isDisabledAdmin(user) {
  const permissions = user?.permissions || [];
  const isAdmin = permissions.some((permission) => permission !== "view_player_portal");
  return isAdmin && ["frozen", "disabled", "removed"].includes(user?.admin_status);
}

export function hasActivePermission(user, permission) {
  if (isDisabledAdmin(user) && permission !== "view_player_portal") return false;
  return hasPermission(user, permission);
}

export function isMasterAdmin(user) {
  return hasActivePermission(user, "master_access") || (user?.roles || []).includes("Master Admin");
}

export function highestRoleRank(userOrPayload = {}) {
  const roles = userOrPayload.roles || [];
  if (roles.includes("Master Admin")) return 5;
  if (roles.includes("Super Admin")) return 4;
  if (roles.includes("Admin")) return 3;
  if (roles.includes("Moderator")) return 2;
  if (roles.includes("Support")) return 1;
  const permissions = userOrPayload.permissions || [];
  if (permissions.includes("master_access")) return 5;
  if (permissions.some((permission) => permission !== "view_player_portal")) return 3;
  return 0;
}

export function includesMasterAuthority(payload = {}) {
  return (
    (payload.roles || []).includes("Master Admin") ||
    (payload.permissions || []).includes("master_access")
  );
}
