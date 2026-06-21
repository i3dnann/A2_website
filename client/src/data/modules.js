export const publicCollections = {
  news: { title: "City Newspaper", api: "news", singular: "Article", description: "Police, EMS, business, court, gang, event, streamer, and mystery news." },
  events: { title: "Events", api: "events", singular: "Event", description: "Operations, races, trials, creator events, and city meetings." },
  businesses: { title: "Businesses", api: "businesses", singular: "Business", description: "Approved city businesses with menus, employees, reviews, and location details." },
  map: { title: "Interactive Map", api: "mapMarkers", singular: "Marker", description: "City locations, jobs, danger zones, event spots, and territory markers." },
  jobs: { title: "Jobs & Ranks", api: "jobPages", singular: "Job", description: "Requirements, ranks, vehicles, uniforms, applications, and rules." },
  characters: { title: "Characters", api: "characterProfiles", singular: "Character", description: "Public character stories, reputations, galleries, and relationship pages." },
  archive: { title: "City Archive", api: "cityArchive", singular: "Archive", description: "Weekly history with best police, EMS, business, gang, streamer, and city events." },
  story: { title: "Story System", api: "storyCampaigns", singular: "Campaign", description: "Mystery campaigns with clues, chapters, warnings, and hidden coordinates." },
  shop: { title: "Cosmetic Shop", api: "shopProducts", singular: "Product", description: "Non-pay-to-win cosmetic products, profile styles, badges, and manual order approval." }
};

export const staffResources = {
  tickets: { title: "Tickets", api: "tickets", permission: "review_tickets", action: "Review player reports, compensation, bugs, and support requests." },
  "ban-appeals": { title: "Ban Appeals", api: "banAppeals", permission: "review_ban_appeals", action: "Accept, reject, reduce, or request more info for punishment appeals." },
  whitelist: { title: "Whitelist", api: "whitelistApplications", permission: "review_whitelist", action: "Review roleplay applications and internal staff notes." },
  logs: { title: "Audit Logs", api: "auditLogs", permission: "view_audit_logs", action: "Inspect staff actions, security events, and webhook-backed history." },
  streamers: { title: "Streamers", api: "streamers", permission: "manage_streamers", action: "Manage Twitch, Kick, YouTube, TikTok, featured, hidden, and approved creator profiles." },
  cms: { title: "CMS", api: "news", permission: "edit_website_settings", action: "Edit homepage modules, news, rules, terms, featured content, and branding." },
  permissions: { title: "Permissions", api: "auditLogs", permission: "manage_admins", action: "Manage roles, permission groups, and dangerous master-only controls." }
};

export const domainResources = {
  police: {
    title: "Police MDC",
    endpoints: ["reports", "warrants", "fines", "callsigns"],
    description: "Citizen search, criminal records, active warrants, fines, incident reports, and callsigns."
  },
  ems: {
    title: "EMS Medical Panel",
    endpoints: ["reports"],
    description: "Patient search, injury history, treatment notes, hospital visits, death reports, and revive logs."
  },
  court: {
    title: "Court & Legal",
    endpoints: ["cases", "documents"],
    description: "Open cases, verdicts, court dates, legal documents, warrants, summons, and appeals."
  },
  "business-owner": {
    title: "Business Owner",
    endpoints: ["dashboard"],
    description: "Business profile, menu, employees, announcements, prices, gallery, applications, and public visibility."
  },
  gang: {
    title: "Gang & Territory",
    endpoints: ["dashboard"],
    description: "Gang profile, territory, members, wars, allies, enemies, warnings, and admin notes."
  }
};
