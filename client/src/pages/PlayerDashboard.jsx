import { Car, FileBadge, IdCard, Ticket, Wallet } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { Card, StatCard } from "../components/Card.jsx";
import { DataTable } from "../components/DataTable.jsx";

export default function PlayerDashboard({ section = "dashboard" }) {
  const { data, loading } = useApi(() => api.get("/api/player/dashboard"), [], { characters: [], tickets: [], banAppeals: [], whitelistApplications: [] });
  const characters = data?.characters || [];
  const mainCharacter = characters[0] || {};

  if (section !== "dashboard") {
    const rows = section === "characters" ? characters : section === "tickets" ? data?.tickets || [] : section === "appeals" ? data?.banAppeals || [] : [data?.user || {}];
    return (
      <Page title={`Player ${section}`} description="Private player data is read-only unless it is a public profile field.">
        <DataTable rows={rows} columns={[
          { key: "name", label: "Name", render: (row) => row.name || row.character_name || row.username || row.title || row.ban_id || row.id },
          { key: "citizenid", label: "Citizen ID" },
          { key: "status", label: "Status", status: true },
          { key: "updated_at", label: "Updated" }
        ]} />
      </Page>
    );
  }

  return (
    <Page title="Player Dashboard" description="Your Discord profile, linked QBCore characters, applications, tickets, appeals, and recent city activity.">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Characters" value={characters.length} hint={mainCharacter.name || "No linked citizen ID yet"} icon={IdCard} />
        <StatCard label="Cash" value={`$${mainCharacter.cash || 0}`} hint="Read-only from QBCore" icon={Wallet} />
        <StatCard label="Vehicles" value={mainCharacter.vehicles?.length || 0} hint="Owned vehicles" icon={Car} />
        <StatCard label="Tickets" value={data?.tickets?.length || 0} hint="Active player tickets" icon={Ticket} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl font-black">Linked characters</h2>
          <DataTable rows={characters} columns={[
            { key: "name", label: "Character" },
            { key: "citizenid", label: "Citizen ID" },
            { key: "job", label: "Job" },
            { key: "gang", label: "Gang" }
          ]} />
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-black">Applications & appeals</h2>
          <DataTable rows={[...(data?.whitelistApplications || []), ...(data?.banAppeals || [])]} columns={[
            { key: "title", label: "Record", render: (row) => row.character_name || row.ban_id || row.title || row.id },
            { key: "status", label: "Status", status: true },
            { key: "updated_at", label: "Updated" }
          ]} empty="No applications or appeals yet." />
        </Card>
      </div>
    </Page>
  );
}

function Page({ title, description, children }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-wide text-a2-green">Player portal</p>
      <h1 className="mt-2 text-3xl font-black">{title}</h1>
      <p className="mt-2 max-w-3xl text-white/55">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
