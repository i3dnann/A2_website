import { Link } from "react-router-dom";
import { BarChart3, Bell, BriefcaseBusiness, FileText, Image, KeyRound, Map, Newspaper, Palette, Radio, Shield, Ticket, Users } from "lucide-react";
import AdminPermissionsPage from "./AdminPermissionsPage.jsx";
import AdminWebhooksPage from "./AdminWebhooksPage.jsx";
import { Card } from "../components/Card.jsx";

const adminCards = [
  ["Homepage", "/admin/home", "Edit hero, text, links, and main website settings.", Palette],
  ["Gallery", "/admin/gallery", "Review, approve, deny, and delete gallery pictures.", Image],
  ["Users", "/admin/users", "Activate, deactivate, ban, unban, and delete accounts.", Users],
  ["Permissions", "/admin/permissions", "View every permission and assign/remove access.", KeyRound],
  ["Webhooks", "/admin/webhooks", "Configure Discord embeds for logs, tickets, and accounts.", Bell],
  ["Tickets", "/admin/tickets", "Answer player tickets and close support cases.", Ticket],
  ["Live", "/admin/live", "Manage streamer/live page settings.", Radio],
  ["Roster", "/admin/roster", "Manage streamers and public roster entries.", Shield],
  ["News", "/admin/news", "Create and edit news posts.", Newspaper],
  ["Careers", "/admin/careers", "Manage jobs, applications, and career questions.", BriefcaseBusiness],
  ["Map", "/admin/map", "Manage safe zones and dangerous zones.", Map],
  ["Audit logs", "/admin/audit-logs", "Review recent admin and security actions.", BarChart3]
];

export function AdminWorkspace({ section = "dashboard" }) {
  if (section === "permissions") return <AdminPermissionsPage />;
  if (section === "webhooks") return <AdminWebhooksPage />;
  if (section !== "dashboard") return <SectionPlaceholder section={section} />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Admin panel</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Gotham City control center</h1>
        <p className="mt-2 text-sm text-white/55">Choose what you want to manage. These cards open the real admin pages directly.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {adminCards.map(([title, href, text, Icon]) => (
          <Link key={href} to={href}>
            <Card className="h-full transition hover:border-a2-green/60 hover:bg-a2-green/5">
              <Icon className="text-a2-green" size={24} />
              <h2 className="mt-4 text-xl font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SectionPlaceholder({ section }) {
  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-black uppercase tracking-widest text-a2-green">Admin section</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">{section}</h1>
      </header>
      <Card>
        <p className="text-sm text-white/55">This section is opened from the admin dashboard or sidebar. Go back to the control center and select the correct page.</p>
        <Link to="/admin" className="mt-4 inline-flex text-sm font-black text-a2-green">Back to control center →</Link>
      </Card>
    </div>
  );
}
