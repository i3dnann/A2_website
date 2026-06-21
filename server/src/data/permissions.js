export const PERMISSIONS = [
  "view_player_portal",
  "submit_whitelist",
  "view_police_panel",
  "edit_police_records",
  "view_ems_panel",
  "edit_medical_records",
  "view_court_panel",
  "manage_court_cases",
  "manage_business",
  "manage_gang",
  "view_streamers",
  "manage_streamers",
  "create_news",
  "review_tickets",
  "review_ban_appeals",
  "review_whitelist",
  "use_staff_panel",
  "ban_players",
  "blacklist_players",
  "edit_website_settings",
  "manage_admins",
  "manage_events",
  "manage_jobs",
  "manage_map",
  "manage_story",
  "manage_shop",
  "view_audit_logs",
  "master_access"
];

export const ROLES = [
  "Guest",
  "Player",
  "Whitelisted Player",
  "Police",
  "EMS",
  "Judge",
  "Lawyer",
  "Business Owner",
  "Gang Leader",
  "Streamer",
  "Content Creator",
  "Staff",
  "Senior Staff",
  "Admin",
  "Super Admin",
  "Master Admin"
];

export const DEFAULT_ROLE_PERMISSIONS = {
  Guest: ["view_streamers"],
  Player: ["view_player_portal", "submit_whitelist", "view_streamers"],
  "Whitelisted Player": ["view_player_portal", "submit_whitelist", "view_streamers"],
  Police: ["view_player_portal", "view_police_panel", "edit_police_records", "view_streamers"],
  EMS: ["view_player_portal", "view_ems_panel", "edit_medical_records", "view_streamers"],
  Judge: ["view_player_portal", "view_court_panel", "manage_court_cases", "view_streamers"],
  Lawyer: ["view_player_portal", "view_court_panel", "view_streamers"],
  "Business Owner": ["view_player_portal", "manage_business", "view_streamers"],
  "Gang Leader": ["view_player_portal", "manage_gang", "view_streamers"],
  Streamer: ["view_player_portal", "view_streamers"],
  "Content Creator": ["view_player_portal", "view_streamers"],
  Staff: ["view_player_portal", "use_staff_panel", "review_tickets", "review_ban_appeals", "review_whitelist", "view_streamers"],
  "Senior Staff": [
    "view_player_portal",
    "use_staff_panel",
    "review_tickets",
    "review_ban_appeals",
    "review_whitelist",
    "create_news",
    "manage_streamers",
    "view_streamers",
    "view_audit_logs"
  ],
  Admin: [
    "view_player_portal",
    "use_staff_panel",
    "review_tickets",
    "review_ban_appeals",
    "review_whitelist",
    "create_news",
    "manage_streamers",
    "manage_events",
    "manage_jobs",
    "manage_map",
    "manage_story",
    "manage_shop",
    "ban_players",
    "view_audit_logs",
    "view_streamers"
  ],
  "Super Admin": PERMISSIONS.filter((permission) => permission !== "master_access"),
  "Master Admin": PERMISSIONS
};

export function permissionsForRoles(roles = []) {
  return [...new Set(roles.flatMap((role) => DEFAULT_ROLE_PERMISSIONS[role] || []))];
}
