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
    "A serious, story-driven CFW roleplay community with active departments, events, support, careers, and player account tools.",
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
  livePageEnabled: true,
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
    key: "team",
    table: "team_members",
    label: "Team Members",
    public: true,
    permission: "manage_team",
    searchFields: ["name", "role_title", "category", "bio"],
    fields: ["name", "role_title", "category", "profile_image_url", "banner_url", "bio", "discord_url", "twitch_url", "kick_url", "youtube_url", "tiktok_url", "instagram_url", "x_url", "sort_order", "is_visible"]
  },
  {
    key: "streamers",
    table: "streamers",
    label: "Live Streamers",
    public: true,
    permission: "manage_live",
    searchFields: ["display_name", "discord_username", "twitch_username", "kick_username", "category", "character_name"],
    fields: [
      "display_name",
      "profile_image_url",
      "avatar_url",
      "banner_url",
      "bio",
      "discord_username",
      "character_name",
      "category",
      "twitch_username",
      "kick_username",
      "youtube_url",
      "discord_url",
      "is_featured",
      "is_approved",
      "is_hidden",
      "sort_order"
    ]
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
    fields: ["title", "subtitle", "content", "image_url", "video_url", "category", "author_name", "published_at", "status", "is_featured", "likes", "dislikes", "sort_order"]
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
  partners: "partners",
  news: "news",
  events: "events",
  journey: "journey",
  famous: "famous",
  team: "team",
  careers: "careerJobs",
  streamers: "streamers",
  map: "mapZones"
};

export const SEED_DATA = {
  partners: [],
  journey: [],
  famous: [],
  team: [],
  streamers: [],
  careerJobs: [],
  careerSections: [],
  careerQuestions: [],
  careerApplications: [],
  careerAnswers: [],
  careerApplicationNotes: [],
  tickets: [],
  ticketMessages: [],
  ticketAttachments: [],
  ticketParticipants: [],
  ticketNotes: [],
  news: [],
  newsCategories: [],
  newsComments: [],
  mapZones: [],
  faqCategories: [],
  faqItems: [],
  terms: [],
  events: [],
  files: [],
  auditLogs: [],
  adminInvites: []
};
