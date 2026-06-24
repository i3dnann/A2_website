import AdminPermissionsPage from "./AdminPermissionsPage.jsx";
import AdminWebhooksPage from "./AdminWebhooksPage.jsx";
import { Card } from "../components/Card.jsx";

export function AdminWorkspace({ section = "dashboard" }) {
  if (section === "permissions") return <AdminPermissionsPage />;
  if (section === "webhooks") return <AdminWebhooksPage />;
  return <div className="grid gap-5"><header><p className="text-sm font-black uppercase tracking-widest text-a2-green">Admin</p><h1 className="mt-2 text-3xl font-black md:text-4xl">{section === "dashboard" ? "Gotham City control center" : section}</h1></header><Card><p className="text-sm text-white/55">This section is controlled by its dedicated admin page. Use the sidebar links for Gallery, Users, Permissions, Tickets, Theme, and Media.</p></Card></div>;
}
