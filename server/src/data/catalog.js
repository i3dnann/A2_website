export const DEFAULT_SETTINGS = {
  websiteName: "A2 Studio",
  logoUrl: "/assets/gotham-logo.png",
  faviconUrl: "/assets/gotham-logo.png",
  primaryColor: "#8b5cf6",
  backgroundColor: "#000000",
  textColor: "#ffffff",
  secondaryColor: "#111111",
  cardBackground: "#141414",
  borderColor: "#242424",
  mutedTextColor: "#b8b8b8",
  dangerColor: "#ff3333",
  warningColor: "#ffaa00",
  successColor: "#35ff6b",
  maintenanceMode: false,
  performanceMode: false,
  navLinks: [
    { label: "Home", url: "/" },
    { label: "Roster", url: "/roster" },
    { label: "Live", url: "/live" },
    { label: "Famous", url: "/famous" },
    { label: "Team", url: "/team" },
    { label: "Careers", url: "/careers" },
    { label: "News", url: "/news" },
    { label: "Map", url: "/map" },
    { label: "FAQ", url: "/faq" }
  ],
  heroTitle: "A2 Studio Roleplay",
  heroSubtitle: "Premium FiveM community",
  heroDescription:
    "A serious, story-driven CFW roleplay community with creator rosters, live streams, events, support, careers, and player account tools.",
  heroBackgroundImage: "/images/gotham-banner-static.jpg",
  heroBackgroundVideo: "",
  heroOverlayOpacity: 78,
  heroPrimaryButtonText: "Join Discord",
  heroPrimaryButtonLink: "https://discord.gg/change-me",
  heroSecondaryButtonText: "Connect to FiveM",
  heroSecondaryButtonLink: "fivem://connect/127.0.0.1",
  storeButtonText: "Store",
  storeButtonLink: "",
  partnersEnabled: true,
  partnerAnimationSpeed: 32,
  partnerDirection: "left",
  partnerGrayscale: true,
  partnerPauseOnHover: true,
  livePageEnabled: true,
  showOfflineStreamers: true,
  showViewerCount: true,
  showThumbnails: true,
  liveStatusCheckIntervalSeconds: 90,
  featuredLiveLimit: 6,
  webhookStreamerGoLive: true,
  webhookStreamerGoOffline: true,
  termsVersion: "1.0.0",
  mapImageUrl: "/assets/fivem-map.svg"
};

const timestamps = ["created_at", "updated_at", "created_by", "updated_by", "deleted_at"];
const common = ["title", "subtitle", "name", "description", "content", "image_url", "banner_url", "category", "status", "sort_order", "is_visible", "metadata_json"];

export const RESOURCE_DEFINITIONS = [
  {
    key: "partners",
    table: "partners",
    label: "Partners",
    public: true,
    permission: "manage_partners",
    searchFields: ["partner_name", "website_url"],
    fields: ["partner_name", "logo_url", "website_url", "sort_order", "is_visible"]
  },
  {
    key: "journey",
    table: "journey_items",
    label: "Journey Timeline",
    public: true,
    permission: "manage_journey",
    searchFields: ["title", "description", "status"],
    fields: ["title", "description", "journey_date", "journey_time", "image_url", "icon", "status", "sort_order", "is_visible"]
  },
  {
    key: "famous",
    table: "famous_characters",
    label: "Famous Characters",
    public: true,
    permission: "manage_famous",
    searchFields: ["character_name", "header", "role_name", "gang_business"],
    fields: ["character_name", "header", "picture_url", "bio", "description", "role_name", "gang_business", "social_links_json", "is_featured", "sort_order", "is_visible"]
  },
  {
    key: "streamers",
    table: "streamers",
    label: "Streamer Roster",
    public: true,
    permission: "manage_roster",
    searchFields: ["display_name", "discord_id", "discord_username", "twitch_username", "kick_username", "category", "character_name"],
    fields: [
      "display_name",
      "profile_image_url",
      "avatar_url",
      "banner_url",
      "bio",
      "discord_id",
      "discord_username",
      "steam_id",
      "character_name",
      "category",
      "twitch_username",
      "kick_username",
      "youtube_url",
      "tiktok_url",
      "instagram_url",
      "x_url",
      "discord_url",
      "is_featured",
      "is_approved",
      "is_hidden",
      "sort_order"
    ]
  },
  {
    key: "team",
    table: "team_members",
    label: "Team Members",
    public: true,
    permission: "manage_team",
    searchFields: ["name", "role_title", "category", "bio"],
    fields: ["name", "role_title", "category", "profile_image_url", "bio", "discord_url", "twitch_url", "kick_url", "youtube_url", "tiktok_url", "instagram_url", "x_url", "sort_order", "is_visible"]
  },
  {
    key: "careerJobs",
    table: "career_jobs",
    label: "Career Jobs",
    public: true,
    permission: "manage_careers",
    searchFields: ["title", "department", "description", "requirements"],
    fields: ["title", "description", "department", "image_url", "is_open", "start_date", "end_date", "requirements", "sort_order", "is_visible"]
  },
  {
    key: "careerSections",
    table: "career_sections",
    label: "Career Sections",
    public: false,
    permission: "manage_careers",
    searchFields: ["title", "job_id"],
    fields: ["job_id", "title", "description", "sort_order", "is_visible"]
  },
  {
    key: "careerQuestions",
    table: "career_questions",
    label: "Career Questions",
    public: false,
    permission: "manage_careers",
    searchFields: ["question", "job_id", "section_id"],
    fields: ["job_id", "section_id", "question", "help_text", "question_type", "options_json", "is_required", "sort_order", "is_visible"]
  },
  {
    key: "careerApplications",
    table: "career_applications",
    label: "Career Applications",
    public: false,
    permission: "review_career_applications",
    searchFields: ["job_id", "user_id", "status"],
    fields: ["job_id", "user_id", "discord_id", "steam_id", "citizenid", "status", "reviewed_by", "reviewed_at", "internal_notes", "sort_order"]
  },
  {
    key: "careerAnswers",
    table: "career_answers",
    label: "Career Answers",
    public: false,
    permission: "review_career_applications",
    searchFields: ["application_id", "question_id", "answer_text"],
    fields: ["application_id", "section_id", "question_id", "question_snapshot", "answer_text", "file_url"]
  },
  {
    key: "careerApplicationNotes",
    table: "career_application_notes",
    label: "Career Notes",
    public: false,
    permission: "review_career_applications",
    searchFields: ["application_id", "note"],
    fields: ["application_id", "admin_id", "note", "is_internal"]
  },
  {
    key: "tickets",
    table: "tickets",
    label: "Tickets",
    public: false,
    permission: "manage_tickets",
    searchFields: ["ticket_number", "subject", "category", "status", "user_id", "discord_id", "steam_id"],
    fields: ["ticket_number", "user_id", "category", "subject", "message_preview", "status", "priority", "assigned_to", "closed_by", "closed_at", "discord_id", "steam_id", "citizenid", "sort_order"]
  },
  {
    key: "ticketMessages",
    table: "ticket_messages",
    label: "Ticket Messages",
    public: false,
    permission: "manage_tickets",
    searchFields: ["ticket_id", "message"],
    fields: ["ticket_id", "author_id", "author_type", "message", "internal_only"]
  },
  {
    key: "ticketAttachments",
    table: "ticket_attachments",
    label: "Ticket Attachments",
    public: false,
    permission: "manage_tickets",
    searchFields: ["ticket_id", "file_url", "original_name"],
    fields: ["ticket_id", "message_id", "file_url", "original_name", "mime_type", "size_bytes"]
  },
  {
    key: "ticketParticipants",
    table: "ticket_participants",
    label: "Ticket Participants",
    public: false,
    permission: "manage_tickets",
    searchFields: ["ticket_id", "user_id", "discord_id", "steam_id"],
    fields: ["ticket_id", "user_id", "discord_id", "steam_id", "added_by", "role_name", "is_active"]
  },
  {
    key: "ticketNotes",
    table: "ticket_notes",
    label: "Ticket Notes",
    public: false,
    permission: "manage_tickets",
    searchFields: ["ticket_id", "note"],
    fields: ["ticket_id", "admin_id", "note"]
  },
  {
    key: "news",
    table: "news_articles",
    label: "News",
    public: true,
    permission: "manage_news",
    searchFields: ["title", "subtitle", "content", "category", "author_name"],
    fields: ["title", "subtitle", "content", "image_url", "category", "author_name", "published_at", "status", "is_featured", "sort_order"]
  },
  {
    key: "newsCategories",
    table: "news_categories",
    label: "News Categories",
    public: false,
    permission: "manage_news",
    searchFields: ["name", "slug"],
    fields: ["name", "slug", "description", "sort_order", "is_visible"]
  },
  {
    key: "newsComments",
    table: "news_comments",
    label: "News Comments",
    public: false,
    permission: "manage_news",
    searchFields: ["news_id", "author_name", "body", "status", "user_id"],
    fields: ["news_id", "user_id", "author_name", "body", "status", "approved", "is_hidden", "sort_order"]
  },
  {
    key: "mapZones",
    table: "map_zones",
    label: "Map Zones",
    public: true,
    permission: "manage_map",
    searchFields: ["zone_name", "zone_type", "description"],
    fields: ["zone_name", "zone_type", "description", "image_url", "position_x", "position_y", "fivem_x", "fivem_y", "fivem_z", "radius", "color", "icon", "sort_order", "is_visible"]
  },
  {
    key: "faqCategories",
    table: "faq_categories",
    label: "FAQ Categories",
    public: true,
    permission: "manage_faq",
    searchFields: ["name"],
    fields: ["name", "description", "sort_order", "is_visible"]
  },
  {
    key: "faqItems",
    table: "faq_items",
    label: "FAQ Items",
    public: true,
    permission: "manage_faq",
    searchFields: ["question", "answer", "category_id"],
    fields: ["category_id", "question", "answer", "sort_order", "is_visible"]
  },
  {
    key: "terms",
    table: "terms_pages",
    label: "Terms",
    public: true,
    permission: "manage_terms",
    searchFields: ["title", "version", "content"],
    fields: ["title", "content", "version", "effective_date", "is_visible", "sort_order"]
  },
  {
    key: "events",
    table: "events",
    label: "Events",
    public: true,
    permission: "manage_events",
    searchFields: ["title", "description", "location", "category", "status_override"],
    fields: ["title", "description", "image_url", "location", "starts_at", "ends_at", "status_override", "category", "sort_order", "is_visible"]
  },
  {
    key: "files",
    table: "web_files",
    label: "Files",
    public: false,
    permission: "manage_files",
    searchFields: ["original_name", "mime_type", "url"],
    fields: ["owner_user_id", "original_name", "stored_name", "mime_type", "size_bytes", "url", "storage_driver", "metadata_json"]
  },
  {
    key: "auditLogs",
    table: "web_audit_logs",
    label: "Audit Logs",
    public: false,
    permission: "view_audit_logs",
    searchFields: ["action", "target_type", "target_id", "staff_name", "reason"],
    fields: ["action", "staff_id", "staff_name", "target_type", "target_id", "reason", "ip", "before_json", "after_json", "status"]
  },
  {
    key: "adminInvites",
    table: "admin_invites",
    label: "Admin Invites",
    public: false,
    permission: "manage_admins",
    searchFields: ["email", "discord_id", "steam_id", "status"],
    fields: ["email", "discord_id", "steam_id", "role_name", "permissions_json", "token_hash", "expires_at", "status"]
  }
];

RESOURCE_DEFINITIONS.forEach((resource) => {
  resource.dbFields = [...new Set([...resource.fields, ...common, ...timestamps])];
});

export const RESOURCE_MAP = Object.fromEntries(RESOURCE_DEFINITIONS.map((resource) => [resource.key, resource]));

export const PUBLIC_COLLECTIONS = {
  news: "news",
  events: "events",
  journey: "journey",
  famous: "famous",
  team: "team",
  partners: "partners",
  careers: "careerJobs",
  map: "mapZones"
};

export const SEED_DATA = {
  partners: [
    { id: "partner-discord", partner_name: "A2 Discord", logo_url: "", website_url: "https://discord.gg/change-me", sort_order: 1, is_visible: true },
    { id: "partner-rp", partner_name: "Roleplay Hub", logo_url: "", website_url: "#", sort_order: 2, is_visible: true },
    { id: "partner-creators", partner_name: "Creator Network", logo_url: "", website_url: "#", sort_order: 3, is_visible: true }
  ],
  journey: [
    { id: "journey-1", title: "City Concept", description: "The A2 Studio roleplay vision begins.", journey_date: "2026-06-01", journey_time: "18:00", status: "past", sort_order: 1, is_visible: true },
    { id: "journey-2", title: "Community Beta", description: "Creators, staff, and early players shape the city.", journey_date: "2026-06-21", journey_time: "20:00", status: "current", sort_order: 2, is_visible: true },
    { id: "journey-3", title: "Opening Week", description: "Public events, careers, and city stories go live.", journey_date: "2026-07-01", journey_time: "19:00", status: "future", sort_order: 3, is_visible: true }
  ],
  famous: [
    {
      id: "maya-knox",
      character_name: "Maya Knox",
      header: "The first face of A2 Studio",
      picture_url: "",
      bio: "A disciplined city operator with a reputation for keeping scenes alive.",
      description: "Replace this seed character from the admin panel with famous roleplay characters from your city.",
      role_name: "Police",
      gang_business: "City Hall",
      social_links_json: "{}",
      is_featured: true,
      sort_order: 1,
      is_visible: true
    }
  ],
  streamers: [
    {
      id: "a2-creator",
      display_name: "A2 Creator",
      profile_image_url: "",
      avatar_url: "",
      banner_url: "",
      bio: "Approved creator placeholder. Add Twitch or Kick channel names in admin to enable live checks.",
      discord_id: "",
      discord_username: "a2creator",
      steam_id: "",
      character_name: "Maya Knox",
      category: "Civilian",
      twitch_username: "",
      kick_username: "",
      youtube_url: "",
      tiktok_url: "",
      instagram_url: "",
      x_url: "",
      discord_url: "https://discord.gg/change-me",
      is_featured: true,
      is_approved: true,
      is_hidden: false,
      sort_order: 1
    }
  ],
  team: [
    { id: "team-owner", name: "A2 Owner", role_title: "Owner", category: "Owner", profile_image_url: "", bio: "Replace with the real owner profile.", sort_order: 1, is_visible: true },
    { id: "team-dev", name: "A2 Developer", role_title: "Developer", category: "Developer", profile_image_url: "", bio: "Responsible for website and city systems.", sort_order: 2, is_visible: true },
    { id: "team-support", name: "A2 Support", role_title: "Support Lead", category: "Support", profile_image_url: "", bio: "Keeps tickets and community help moving.", sort_order: 3, is_visible: true }
  ],
  careerJobs: [
    { id: "career-police", title: "Police Department", department: "Law Enforcement", description: "Apply to patrol, investigate, and protect A2 Studio.", image_url: "", is_open: true, start_date: "2026-06-21", end_date: null, requirements: "Mature RP, clean record, microphone, interview.", sort_order: 1, is_visible: true },
    { id: "career-ems", title: "EMS Department", department: "Medical", description: "Apply to become part of the emergency medical team.", image_url: "", is_open: true, start_date: "2026-06-21", end_date: null, requirements: "Calm communication, RP experience, training availability.", sort_order: 2, is_visible: true }
  ],
  careerSections: [
    { id: "section-personal", job_id: "career-police", title: "Personal information", description: "Basic identity and contact details.", sort_order: 1, is_visible: true },
    { id: "section-rp", job_id: "career-police", title: "Roleplay experience", description: "Tell us how you handle scenes.", sort_order: 2, is_visible: true }
  ],
  careerQuestions: [
    { id: "question-age", job_id: "career-police", section_id: "section-personal", question: "What is your age?", help_text: "", question_type: "number", options_json: "[]", is_required: true, sort_order: 1, is_visible: true },
    { id: "question-scenario", job_id: "career-police", section_id: "section-rp", question: "Describe how you would handle a tense traffic stop.", help_text: "", question_type: "long_text", options_json: "[]", is_required: true, sort_order: 2, is_visible: true }
  ],
  careerApplications: [],
  careerAnswers: [],
  careerApplicationNotes: [],
  tickets: [],
  ticketMessages: [],
  ticketAttachments: [],
  ticketParticipants: [],
  ticketNotes: [],
  news: [
    { id: "news-launch", title: "A2 Studio Website Launch", subtitle: "A new home for the community.", content: "Manage news from the admin panel and publish updates for your FiveM city.", image_url: "", category: "Community", author_name: "A2 Studio", published_at: new Date().toISOString(), status: "Published", is_featured: true, sort_order: 1 }
  ],
  newsCategories: [
    { id: "news-cat-community", name: "Community", slug: "community", description: "Community updates.", sort_order: 1, is_visible: true }
  ],
  newsComments: [],
  mapZones: [
    { id: "zone-safe-legion", zone_name: "Legion Square", zone_type: "Safe zone", description: "Public meet-up and safe roleplay space.", image_url: "", position_x: 48, position_y: 52, fivem_x: 215.8, fivem_y: -810.1, fivem_z: 30.7, radius: 80, color: "#35ff6b", icon: "shield", sort_order: 1, is_visible: true },
    { id: "zone-danger-docks", zone_name: "Docks", zone_type: "Dangerous zone", description: "High-risk industrial area.", image_url: "", position_x: 74, position_y: 68, fivem_x: 915.5, fivem_y: -2910.1, fivem_z: 5.9, radius: 140, color: "#ff3333", icon: "alert-triangle", sort_order: 2, is_visible: true }
  ],
  faqCategories: [
    { id: "faq-general", name: "General", description: "Common community questions.", sort_order: 1, is_visible: true }
  ],
  faqItems: [
    { id: "faq-steam", category_id: "faq-general", question: "Why do I need Steam linked?", answer: "Steam is used to safely match your website account with your own FiveM characters.", sort_order: 1, is_visible: true },
    { id: "faq-livestream", category_id: "faq-general", question: "How do I appear on the roster?", answer: "Apply through staff or ask an admin to add and approve your creator profile.", sort_order: 2, is_visible: true }
  ],
  terms: [
    { id: "terms-default", title: "A2 Studio Terms", content: "Respect staff, players, and roleplay. Full rules and legal terms can be edited from the admin panel.", version: "1.0.0", effective_date: "2026-06-21", is_visible: true, sort_order: 1 }
  ],
  events: [
    { id: "event-opening", title: "Opening Night", description: "Community gathering, staff introductions, and city photos.", image_url: "", location: "Legion Square", starts_at: new Date(Date.now() + 86400000).toISOString(), ends_at: new Date(Date.now() + 93600000).toISOString(), status_override: "", category: "Community", sort_order: 1, is_visible: true }
  ],
  files: [],
  auditLogs: [],
  adminInvites: []
};
