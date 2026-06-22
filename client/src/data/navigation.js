import {
  Calendar,
  Construction,
  FileQuestion,
  Home,
  LayoutDashboard,
  Map,
  Newspaper,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Star,
  Ticket,
  UserCircle,
  Users,
  Video,
  Workflow
} from "lucide-react";

export const publicNav = [
  { label: "Home", href: "/", icon: Home },
  { label: "Roster", href: "/roster", icon: Video },
  { label: "Live", href: "/live", icon: Sparkles },
  { label: "Famous", href: "/famous", icon: UserCircle },
  { label: "Team", href: "/team", icon: Users },
  { label: "Careers", href: "/careers", icon: Workflow },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Map", href: "/map", icon: Map },
  { label: "FAQ", href: "/faq", icon: FileQuestion }
];

export const accountNav = [
  { label: "Account", href: "/account", icon: LayoutDashboard, permission: "view_player_portal" },
  { label: "Characters", href: "/account/characters", icon: UserCircle, permission: "view_player_portal" },
  { label: "Tickets", href: "/account/tickets", icon: Ticket, permission: "view_player_portal" },
  { label: "Applications", href: "/account/applications", icon: Workflow, permission: "view_player_portal" },
  { label: "Settings", href: "/account/settings", icon: Settings, permission: "view_player_portal" }
];

export const adminNav = [
  { label: "Admin", href: "/admin", icon: LayoutDashboard, permission: "manage_home" },
  { label: "Settings", href: "/admin/settings", icon: Settings, permission: "manage_home" },
  { label: "Maintenance", href: "/admin/maintenance", icon: Construction, permission: "manage_home" },
  { label: "Home", href: "/admin/home", icon: Home, permission: "manage_home" },
  { label: "Partners", href: "/admin/partners", icon: Star, permission: "manage_partners" },
  { label: "Journey", href: "/admin/journey", icon: Workflow, permission: "manage_journey" },
  { label: "Famous", href: "/admin/famous", icon: UserCircle, permission: "manage_famous" },
  { label: "Roster", href: "/admin/roster", icon: Video, permission: "manage_roster" },
  { label: "Live", href: "/admin/live", icon: Sparkles, permission: "manage_live" },
  { label: "Team", href: "/admin/team", icon: Users, permission: "manage_team" },
  { label: "Careers", href: "/admin/careers", icon: Workflow, permission: "manage_careers" },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket, permission: "manage_tickets" },
  { label: "News", href: "/admin/news", icon: Newspaper, permission: "manage_news" },
  { label: "Map", href: "/admin/map", icon: Map, permission: "manage_map" },
  { label: "FAQ", href: "/admin/faq", icon: FileQuestion, permission: "manage_faq" },
  { label: "Terms", href: "/admin/terms", icon: ScrollText, permission: "manage_terms" },
  { label: "Events", href: "/admin/events", icon: Calendar, permission: "manage_events" },
  { label: "Users", href: "/admin/users", icon: Users, permission: "manage_users" },
  { label: "Admins", href: "/admin/admins", icon: Shield, permission: "manage_admins" },
  { label: "Permissions", href: "/admin/permissions", icon: Shield, permission: "manage_permissions" },
  { label: "Webhooks", href: "/admin/webhooks", icon: Sparkles, permission: "manage_webhooks" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText, permission: "view_audit_logs" },
  { label: "Theme", href: "/admin/theme", icon: Settings, permission: "manage_theme" }
];

export const dashboardNav = [...accountNav, ...adminNav];
