import {
  Activity,
  Ambulance,
  Archive,
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Car,
  FileBadge,
  FileText,
  Gavel,
  Home,
  IdCard,
  Landmark,
  LayoutDashboard,
  Map,
  Newspaper,
  RadioTower,
  ScrollText,
  Search,
  Settings,
  Shield,
  Siren,
  Sparkles,
  Ticket,
  Users,
  Video
} from "lucide-react";

export const publicNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Businesses", href: "/businesses", icon: Building2 },
  { label: "Map", href: "/map", icon: Map },
  { label: "Jobs", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Characters", href: "/characters", icon: IdCard },
  { label: "Streamers", href: "/streamers", icon: Video },
  { label: "Status", href: "/status", icon: Activity },
  { label: "Rules", href: "/rules", icon: ScrollText }
];

export const dashboardNav = {
  player: [
    { label: "Dashboard", href: "/player/dashboard", icon: LayoutDashboard, permission: "view_player_portal" },
    { label: "My characters", href: "/player/characters", icon: IdCard, permission: "view_player_portal" },
    { label: "My tickets", href: "/player/tickets", icon: Ticket, permission: "view_player_portal" },
    { label: "My ban appeals", href: "/player/appeals", icon: FileBadge, permission: "view_player_portal" },
    { label: "My profile", href: "/player/profile", icon: Users, permission: "view_player_portal" }
  ],
  police: [
    { label: "Police dashboard", href: "/police/dashboard", icon: Shield, permission: "view_police_panel" },
    { label: "Citizen search", href: "/police/search", icon: Search, permission: "view_police_panel" },
    { label: "Reports", href: "/police/reports", icon: FileText, permission: "view_police_panel" },
    { label: "Warrants", href: "/police/warrants", icon: Siren, permission: "view_police_panel" },
    { label: "Fines", href: "/police/fines", icon: BadgeDollarSign, permission: "view_police_panel" },
    { label: "Callsigns", href: "/police/callsigns", icon: RadioTower, permission: "view_police_panel" }
  ],
  ems: [
    { label: "EMS dashboard", href: "/ems/dashboard", icon: Ambulance, permission: "view_ems_panel" },
    { label: "Patient search", href: "/ems/search", icon: Search, permission: "view_ems_panel" },
    { label: "Reports", href: "/ems/reports", icon: FileText, permission: "view_ems_panel" }
  ],
  admin: [
    { label: "Staff dashboard", href: "/staff/dashboard", icon: LayoutDashboard, permission: "use_staff_panel" },
    { label: "Player search", href: "/staff/search", icon: Search, permission: "use_staff_panel" },
    { label: "Tickets", href: "/staff/tickets", icon: Ticket, permission: "review_tickets" },
    { label: "Ban appeals", href: "/staff/ban-appeals", icon: FileBadge, permission: "review_ban_appeals" },
    { label: "Whitelist", href: "/staff/whitelist", icon: FileText, permission: "review_whitelist" },
    { label: "Streamers", href: "/staff/streamers", icon: Video, permission: "manage_streamers" },
    { label: "Logs", href: "/staff/logs", icon: Archive, permission: "view_audit_logs" },
    { label: "Website settings", href: "/staff/settings", icon: Settings, permission: "edit_website_settings" },
    { label: "Permissions", href: "/staff/permissions", icon: Shield, permission: "manage_admins" },
    { label: "CMS", href: "/staff/cms", icon: Sparkles, permission: "edit_website_settings" }
  ],
  court: [
    { label: "Court dashboard", href: "/court/dashboard", icon: Landmark, permission: "view_court_panel" },
    { label: "Cases", href: "/court/cases", icon: Gavel, permission: "view_court_panel" },
    { label: "Documents", href: "/court/documents", icon: FileText, permission: "view_court_panel" }
  ],
  business: [
    { label: "Business owner", href: "/business-owner/dashboard", icon: Building2, permission: "manage_business" }
  ],
  gang: [
    { label: "Gang dashboard", href: "/gang/dashboard", icon: Users, permission: "manage_gang" }
  ]
};

export const allDashboardNav = Object.values(dashboardNav).flat();
