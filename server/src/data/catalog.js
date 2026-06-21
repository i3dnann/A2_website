export const DEFAULT_SETTINGS = {
  websiteName: "A2 Studio",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#b7fe1a",
  backgroundColor: "#000000",
  textColor: "#ffffff",
  secondaryDark: "#111111",
  borderColor: "#242424",
  dangerColor: "#ff3333",
  warningColor: "#ffaa00",
  successColor: "#35ff6b",
  heroBackgroundUrl: "",
  homepageDescription: "A premium FiveM QBCore roleplay city platform for players, staff, police, EMS, court, businesses, gangs, and creators.",
  discordInviteUrl: "https://discord.gg/change-me",
  fivemConnectUrl: "fivem://connect/your-server-ip",
  maintenanceMode: false,
  performanceMode: false,
  defaultLanguage: "en",
  termsVersion: "1.0.0",
  termsText: "Respect the city, the staff, and the roleplay. Custom terms can be edited in the admin settings panel.",
  rulesText: "Use common sense, stay in character, avoid toxicity, and follow all city laws and staff instructions.",
  streamerPageEnabled: true,
  streamerStatusCheckIntervalSeconds: 90,
  showOfflineStreamers: true,
  showStreamerViewerCount: true,
  showStreamThumbnails: true,
  featuredStreamersLimit: 6,
  liveStreamersLimit: 12,
  webhookStreamerGoLive: false,
  webhookStreamerGoOffline: false
};

const commonFields = [
  "title",
  "name",
  "subtitle",
  "description",
  "content",
  "category",
  "status",
  "image_url",
  "banner_url",
  "citizenid",
  "discord_id",
  "character_name",
  "assigned_to",
  "priority",
  "visibility",
  "starts_at",
  "ends_at",
  "metadata_json"
];

export const RESOURCE_DEFINITIONS = [
  {
    key: "news",
    table: "news_articles",
    label: "News Articles",
    public: true,
    permission: "create_news",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["title", "subtitle", "category", "content"],
    fields: [...commonFields, "author_name", "language", "tags", "is_featured", "publish_at"]
  },
  {
    key: "events",
    table: "events",
    label: "Events",
    public: true,
    permission: "manage_events",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["title", "category", "location"],
    fields: [...commonFields, "location", "requirements", "max_participants", "reward", "host"]
  },
  {
    key: "businesses",
    table: "businesses",
    label: "Businesses",
    public: true,
    permission: "manage_business",
    webhook: "WEBHOOK_BUSINESS",
    searchFields: ["name", "business_type", "owner_name", "description"],
    fields: [...commonFields, "business_type", "owner_name", "opening_hours", "location", "weekly_rating", "is_approved"]
  },
  {
    key: "mapMarkers",
    table: "map_markers",
    label: "Map Markers",
    public: true,
    permission: "manage_map",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["name", "marker_type", "description"],
    fields: [...commonFields, "marker_type", "x", "y", "z", "icon", "color"]
  },
  {
    key: "jobPages",
    table: "job_pages",
    label: "Jobs",
    public: true,
    permission: "manage_jobs",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["name", "description", "requirements"],
    fields: [...commonFields, "requirements", "how_to_apply", "vehicles", "uniforms", "bosses"]
  },
  {
    key: "characterProfiles",
    table: "character_profiles",
    label: "Character Profiles",
    public: true,
    permission: "view_player_portal",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["character_name", "citizenid", "backstory"],
    fields: [...commonFields, "age", "backstory", "personality", "job", "gang", "profile_image_url", "privacy"]
  },
  {
    key: "tickets",
    table: "tickets",
    label: "Tickets",
    public: false,
    permission: "review_tickets",
    webhook: "WEBHOOK_TICKETS",
    searchFields: ["title", "ticket_type", "discord_id", "citizenid"],
    fields: [...commonFields, "ticket_type", "created_by_user_id", "compensation_status"]
  },
  {
    key: "whitelistApplications",
    table: "whitelist_applications",
    label: "Whitelist Applications",
    public: false,
    permission: "review_whitelist",
    webhook: "WEBHOOK_WHITELIST",
    searchFields: ["discord_id", "discord_username", "character_name", "status"],
    fields: [...commonFields, "discord_username", "age_confirmed", "rules_agreed", "terms_agreed", "language", "review_reason"]
  },
  {
    key: "banAppeals",
    table: "ban_appeals",
    label: "Ban Appeals",
    public: false,
    permission: "review_ban_appeals",
    webhook: "WEBHOOK_BAN_APPEALS",
    searchFields: ["ban_id", "discord_id", "citizenid", "status"],
    fields: [...commonFields, "ban_id", "ban_reason", "player_explanation", "decision_reason"]
  },
  {
    key: "policeReports",
    table: "police_reports",
    label: "Police Reports",
    public: false,
    permission: "edit_police_records",
    webhook: "WEBHOOK_POLICE",
    searchFields: ["case_number", "citizenid", "title", "officer_name"],
    fields: [...commonFields, "case_number", "officer_name", "danger_level", "fine_amount", "jail_time"]
  },
  {
    key: "policeWarrants",
    table: "police_warrants",
    label: "Warrants",
    public: false,
    permission: "edit_police_records",
    webhook: "WEBHOOK_POLICE",
    searchFields: ["citizenid", "character_name", "reason", "assigned_officer"],
    fields: [...commonFields, "reason", "danger_level", "assigned_officer", "expires_at"]
  },
  {
    key: "policeFines",
    table: "police_fines",
    label: "Fines",
    public: false,
    permission: "edit_police_records",
    webhook: "WEBHOOK_POLICE",
    searchFields: ["citizenid", "character_name", "officer_name"],
    fields: [...commonFields, "officer_name", "amount", "reason"]
  },
  {
    key: "emsRecords",
    table: "ems_records",
    label: "Medical Records",
    public: false,
    permission: "edit_medical_records",
    webhook: "WEBHOOK_EMS",
    searchFields: ["citizenid", "patient_name", "assigned_doctor"],
    fields: [...commonFields, "patient_name", "blood_type", "known_injuries", "assigned_doctor"]
  },
  {
    key: "courtCases",
    table: "court_cases",
    label: "Court Cases",
    public: false,
    permission: "manage_court_cases",
    webhook: "WEBHOOK_COURT",
    searchFields: ["case_number", "defendant", "plaintiff", "judge_name"],
    fields: [...commonFields, "case_number", "defendant", "plaintiff", "judge_name", "lawyer_name", "fine_amount", "jail_time"]
  },
  {
    key: "businessApplications",
    table: "business_applications",
    label: "Business Applications",
    public: false,
    permission: "manage_business",
    webhook: "WEBHOOK_BUSINESS",
    searchFields: ["business_name", "discord_id", "status"],
    fields: [...commonFields, "business_name", "business_type", "applicant_name"]
  },
  {
    key: "gangs",
    table: "gangs",
    label: "Gangs",
    public: true,
    permission: "manage_gang",
    webhook: "WEBHOOK_GANG",
    searchFields: ["name", "leader_name", "territory"],
    fields: [...commonFields, "leader_name", "territory", "reputation", "color", "war_status", "is_public"]
  },
  {
    key: "gangTerritories",
    table: "gang_territories",
    label: "Territories",
    public: false,
    permission: "manage_gang",
    webhook: "WEBHOOK_GANG",
    searchFields: ["name", "controlled_by", "danger_level"],
    fields: [...commonFields, "controlled_by", "conflict_level", "danger_level", "fear_level"]
  },
  {
    key: "shopProducts",
    table: "shop_products",
    label: "Cosmetic Shop",
    public: true,
    permission: "manage_shop",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["name", "category", "description"],
    fields: [...commonFields, "price", "availability", "requires_approval"]
  },
  {
    key: "shopOrders",
    table: "shop_orders",
    label: "Shop Orders",
    public: false,
    permission: "manage_shop",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["discord_id", "citizenid", "status"],
    fields: [...commonFields, "product_id", "price", "delivery_note"]
  },
  {
    key: "cityArchive",
    table: "city_archive",
    label: "City Archive",
    public: true,
    permission: "create_news",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["title", "week_number", "story_summary"],
    fields: [...commonFields, "week_number", "month", "story_summary", "best_police", "best_ems", "best_business", "best_gang", "best_streamer"]
  },
  {
    key: "storyCampaigns",
    table: "story_campaigns",
    label: "Story Campaigns",
    public: true,
    permission: "manage_story",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["name", "description", "status"],
    fields: [...commonFields, "start_date", "end_date", "linked_event_id"]
  },
  {
    key: "storyClues",
    table: "story_clues",
    label: "Story Clues",
    public: true,
    permission: "manage_story",
    webhook: "WEBHOOK_ADMIN_LOGS",
    searchFields: ["title", "campaign_id", "content"],
    fields: [...commonFields, "campaign_id", "clue_type", "release_at", "encrypted_payload"]
  },
  {
    key: "streamers",
    table: "streamers",
    label: "Streamers",
    public: true,
    permission: "manage_streamers",
    webhook: "WEBHOOK_STREAMERS",
    searchFields: ["display_name", "discord_id", "twitch_username", "kick_username", "category"],
    fields: [
      "display_name",
      "discord_id",
      "discord_username",
      "avatar_url",
      "banner_url",
      "bio",
      "main_platform",
      "twitch_username",
      "kick_username",
      "youtube_url",
      "tiktok_url",
      "discord_url",
      "character_name",
      "category",
      "is_featured",
      "is_approved",
      "is_hidden",
      "sort_order"
    ]
  },
  {
    key: "auditLogs",
    table: "web_audit_logs",
    label: "Audit Logs",
    public: false,
    permission: "view_audit_logs",
    webhook: "WEBHOOK_SECURITY_LOGS",
    searchFields: ["action", "target_type", "reason", "staff_name"],
    fields: [...commonFields, "action", "staff_id", "staff_name", "target_type", "target_id", "reason", "ip", "before_json", "after_json"]
  }
];

const DB_FIELD_OVERRIDES = {
  news: ["title", "subtitle", "image_url", "content", "category", "author_name", "language", "tags", "is_featured", "status", "publish_at", "metadata_json", "sort_order"],
  events: ["title", "description", "image_url", "category", "starts_at", "ends_at", "location", "requirements", "max_participants", "reward", "host", "status", "metadata_json", "sort_order"],
  businesses: ["name", "business_type", "logo_url", "banner_url", "description", "owner_id", "owner_name", "opening_hours", "location", "weekly_rating", "revenue_stats_json", "is_approved", "status", "metadata_json", "sort_order"],
  mapMarkers: ["name", "marker_type", "description", "x", "y", "z", "icon", "color", "image_url", "visibility", "status", "metadata_json", "sort_order"],
  jobPages: ["name", "description", "requirements", "how_to_apply", "vehicles", "uniforms", "rules", "bosses", "employees_public", "status", "metadata_json", "sort_order"],
  characterProfiles: ["user_id", "citizenid", "character_name", "age", "backstory", "personality", "job", "gang", "profile_image_url", "privacy", "status", "metadata_json", "sort_order"],
  tickets: ["title", "ticket_type", "description", "discord_id", "citizenid", "status", "priority", "assigned_to", "compensation_status", "metadata_json", "sort_order"],
  whitelistApplications: ["discord_id", "discord_username", "character_name", "age_confirmed", "rules_agreed", "terms_agreed", "language", "backstory", "roleplay_experience", "status", "review_reason", "metadata_json", "sort_order"],
  banAppeals: ["ban_id", "discord_id", "citizenid", "ban_reason", "player_explanation", "why_unban", "evidence_url", "status", "decision_reason", "metadata_json", "sort_order"],
  policeReports: ["case_number", "title", "description", "citizenid", "character_name", "officer_name", "category", "status", "danger_level", "fine_amount", "jail_time", "metadata_json", "sort_order"],
  policeWarrants: ["citizenid", "character_name", "reason", "danger_level", "assigned_officer", "status", "expires_at", "metadata_json", "sort_order"],
  policeFines: ["citizenid", "character_name", "officer_name", "reason", "amount", "status", "metadata_json", "sort_order"],
  emsRecords: ["patient_name", "citizenid", "blood_type", "known_injuries", "medical_history", "medication_notes", "treatment_notes", "assigned_doctor", "status", "metadata_json", "sort_order"],
  courtCases: ["case_number", "title", "description", "defendant", "plaintiff", "judge_name", "lawyer_name", "status", "fine_amount", "jail_time", "appeal_status", "evidence_json", "metadata_json", "sort_order"],
  businessApplications: ["business_name", "business_type", "applicant_name", "discord_id", "description", "status", "metadata_json", "sort_order"],
  gangs: ["name", "logo_url", "color", "leader_name", "territory", "reputation", "public_description", "description", "allies_json", "enemies_json", "war_status", "warnings_json", "admin_notes", "is_public", "status", "metadata_json", "sort_order"],
  gangTerritories: ["name", "controlled_by", "conflict_level", "danger_level", "fear_level", "last_conflict_at", "metadata_json", "sort_order"],
  shopProducts: ["name", "description", "image_url", "price", "category", "availability", "requires_approval", "status", "metadata_json", "sort_order"],
  shopOrders: ["product_id", "user_id", "discord_id", "citizenid", "price", "status", "delivery_note", "metadata_json", "sort_order"],
  cityArchive: ["title", "week_number", "month", "major_events", "biggest_crime", "biggest_court_case", "best_police", "best_ems", "best_business", "best_gang", "best_streamer", "most_watched_streamer", "most_wanted", "deaths", "server_changes", "screenshots_json", "video_links_json", "story_summary", "status", "metadata_json", "sort_order"],
  storyCampaigns: ["name", "title", "description", "status", "start_date", "end_date", "visibility", "linked_event_id", "linked_map_markers_json", "metadata_json", "sort_order"],
  storyClues: ["campaign_id", "title", "content", "clue_type", "encrypted_payload", "release_at", "visibility", "status", "metadata_json", "sort_order"],
  streamers: ["display_name", "discord_id", "discord_username", "avatar_url", "banner_url", "bio", "main_platform", "twitch_username", "kick_username", "youtube_url", "tiktok_url", "discord_url", "character_name", "category", "is_featured", "is_approved", "is_hidden", "sort_order"],
  auditLogs: ["action", "staff_id", "staff_name", "target_type", "target_id", "reason", "ip", "before_json", "after_json", "status", "sort_order"]
};

RESOURCE_DEFINITIONS.forEach((resource) => {
  resource.dbFields = DB_FIELD_OVERRIDES[resource.key] || resource.fields;
});

export const RESOURCE_MAP = Object.fromEntries(RESOURCE_DEFINITIONS.map((resource) => [resource.key, resource]));

export const SEED_DATA = {
  news: [
    {
      id: "news-1",
      title: "A2 Studio City Hall Opens",
      subtitle: "The new city control center is ready for roleplay stories.",
      category: "Server updates",
      status: "Published",
      image_url: "",
      content: "Welcome to the A2 Studio city platform. Staff can replace this article from the CMS.",
      author_name: "City Desk",
      language: "en",
      tags: "launch,city",
      is_featured: true,
      publish_at: new Date().toISOString()
    }
  ],
  events: [
    {
      id: "event-1",
      title: "Opening Night Patrol",
      category: "Community meeting",
      status: "Published",
      location: "Legion Square",
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 90000000).toISOString(),
      description: "A public meetup for citizens, staff, police, EMS, businesses, and creators."
    }
  ],
  businesses: [
    {
      id: "business-1",
      name: "A2 Customs",
      business_type: "Mechanic",
      owner_name: "Unassigned",
      description: "A featured city business ready to be claimed by an owner.",
      opening_hours: "18:00-23:00",
      weekly_rating: 4.8,
      status: "Approved",
      is_approved: true
    }
  ],
  mapMarkers: [
    {
      id: "marker-1",
      name: "Police Department",
      marker_type: "Police station",
      description: "Public safety headquarters.",
      x: 428.2,
      y: -984.4,
      z: 30.7,
      icon: "shield",
      color: "#35a7ff",
      visibility: "Public"
    }
  ],
  jobPages: [
    {
      id: "job-1",
      name: "Police",
      description: "Protect the city with investigation, patrol, and command roles.",
      requirements: "Whitelist, interview, and clean disciplinary record.",
      how_to_apply: "Apply through the player portal.",
      status: "Published"
    },
    {
      id: "job-2",
      name: "EMS",
      description: "Respond to emergencies, hospital roleplay, and medical cases.",
      requirements: "Whitelist, training, and interview.",
      how_to_apply: "Apply through the player portal.",
      status: "Published"
    }
  ],
  characterProfiles: [
    {
      id: "char-1",
      character_name: "Maya Knox",
      citizenid: "A2DEMO1",
      age: 28,
      job: "Police",
      gang: "None",
      privacy: "Public",
      backstory: "A featured demo character. Players can replace this from their portal.",
      status: "Published"
    }
  ],
  tickets: [
    {
      id: "ticket-1",
      title: "Lost item example",
      ticket_type: "Lost items",
      status: "Open",
      priority: "Normal",
      description: "A safe development ticket example.",
      discord_id: "000000000000000000"
    }
  ],
  whitelistApplications: [
    {
      id: "wl-1",
      discord_id: "000000000000000000",
      discord_username: "demo_player",
      character_name: "Maya Knox",
      status: "Submitted",
      age_confirmed: true,
      rules_agreed: true,
      terms_agreed: true,
      language: "en"
    }
  ],
  banAppeals: [
    {
      id: "appeal-1",
      ban_id: "DEMO-BAN",
      discord_id: "000000000000000000",
      citizenid: "A2DEMO1",
      status: "Under review",
      ban_reason: "Development sample",
      player_explanation: "This row is safe seed data."
    }
  ],
  policeReports: [
    {
      id: "police-1",
      case_number: "A2-PD-0001",
      title: "Traffic stop report",
      officer_name: "Officer Demo",
      citizenid: "A2DEMO1",
      status: "Open",
      danger_level: "Low"
    }
  ],
  policeWarrants: [],
  policeFines: [],
  emsRecords: [
    {
      id: "ems-1",
      patient_name: "Maya Knox",
      citizenid: "A2DEMO1",
      blood_type: "O+",
      known_injuries: "None",
      assigned_doctor: "Dr. Demo",
      status: "Active"
    }
  ],
  courtCases: [
    {
      id: "court-1",
      case_number: "A2-COURT-0001",
      defendant: "Demo Defendant",
      plaintiff: "City of A2",
      judge_name: "Judge Demo",
      status: "Open"
    }
  ],
  businessApplications: [],
  gangs: [
    {
      id: "gang-1",
      name: "Northside Crew",
      leader_name: "Unknown",
      territory: "North LS",
      reputation: 42,
      is_public: true,
      status: "Active",
      description: "Public-safe demo gang profile."
    }
  ],
  gangTerritories: [],
  shopProducts: [
    {
      id: "shop-1",
      name: "Custom Profile Frame",
      category: "Website profile theme",
      price: 10,
      availability: "Available",
      requires_approval: true,
      description: "Cosmetic-only website profile styling."
    }
  ],
  shopOrders: [],
  cityArchive: [
    {
      id: "archive-1",
      title: "Week 1 Archive",
      week_number: 1,
      month: "Launch",
      story_summary: "A clean starting archive entry for the city history system.",
      status: "Published"
    }
  ],
  storyCampaigns: [
    {
      id: "story-1",
      name: "Signal Zero",
      title: "Signal Zero",
      description: "A mysterious city campaign with editable chapters and clues.",
      status: "Published"
    }
  ],
  storyClues: [],
  streamers: [
    {
      id: "streamer-1",
      display_name: "A2 Creator",
      discord_id: "000000000000000000",
      discord_username: "a2creator",
      avatar_url: "",
      banner_url: "",
      bio: "Featured creator placeholder. Add real Twitch/Kick channels in the admin panel.",
      main_platform: "Twitch",
      twitch_username: "",
      kick_username: "",
      youtube_url: "",
      tiktok_url: "",
      discord_url: "",
      character_name: "Maya Knox",
      category: "Civilian",
      is_featured: true,
      is_approved: true,
      is_hidden: false,
      sort_order: 1
    }
  ],
  auditLogs: []
};
