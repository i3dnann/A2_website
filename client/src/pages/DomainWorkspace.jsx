import { useState } from "react";
import { Ambulance, BriefcaseBusiness, Gavel, Shield, Users } from "lucide-react";
import { api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { domainResources } from "../data/modules.js";
import { Button } from "../components/Button.jsx";
import { Card, StatCard } from "../components/Card.jsx";
import { DataTable } from "../components/DataTable.jsx";

const iconMap = {
  police: Shield,
  ems: Ambulance,
  court: Gavel,
  "business-owner": BriefcaseBusiness,
  gang: Users
};

export default function DomainWorkspace({ domain, page = "dashboard" }) {
  const config = domainResources[domain] || domainResources.police;
  const [q, setQ] = useState("");
  const dashboard = useApi(() => api.get(`/api/${domain}/dashboard`), [domain], { cards: [], resources: {} });
  const search = useApi(() => (page === "search" ? api.get(`/api/${domain}/search?q=${encodeURIComponent(q)}`) : Promise.resolve({ players: [] })), [domain, page, q], { players: [] });
  const resourceKey = resourceFor(domain, page);
  const records = useApi(() => (resourceKey ? api.get(`/api/${domain}/${resourceKey}`) : Promise.resolve({ rows: [] })), [domain, resourceKey], { rows: [] });
  const Icon = iconMap[domain] || Shield;

  if (page === "search") {
    return (
      <Header title={`${config.title} Search`} description={config.description}>
        <DataTable rows={search.data?.players || []} search={q} onSearch={setQ} columns={[
          { key: "name", label: "Citizen" },
          { key: "citizenid", label: "Citizen ID" },
          { key: "phone", label: "Phone" },
          { key: "job", label: "Job" },
          { key: "gang", label: "Gang" }
        ]} empty="Search citizens by ID, character name, phone, license, or vehicle plate." />
      </Header>
    );
  }

  if (resourceKey) {
    return (
      <Header title={`${config.title} / ${page}`} description={config.description}>
        <div className="mb-4">
          <Button onClick={() => alert("Create flow is backed by API; wire detailed forms per city SOP.")}>Create record</Button>
        </div>
        <DataTable rows={records.data?.rows || []} columns={[
          { key: "title", label: "Title", render: (row) => row.title || row.case_number || row.patient_name || row.defendant || row.name || row.id },
          { key: "citizenid", label: "Citizen ID" },
          { key: "status", label: "Status", status: true },
          { key: "updated_at", label: "Updated" }
        ]} />
      </Header>
    );
  }

  return (
    <Header title={config.title} description={config.description}>
      <div className="grid gap-4 md:grid-cols-4">
        {(dashboard.data?.cards || []).map((card) => <StatCard key={card.label} label={card.label} value={card.value} icon={Icon} />)}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {Object.entries(dashboard.data?.resources || {}).map(([name, rows]) => (
          <Card key={name}>
            <h2 className="mb-4 text-xl font-black">{name}</h2>
            <DataTable rows={rows} columns={[
              { key: "title", label: "Record", render: (row) => row.title || row.case_number || row.patient_name || row.name || row.id },
              { key: "status", label: "Status", status: true },
              { key: "updated_at", label: "Updated" }
            ]} />
          </Card>
        ))}
      </div>
    </Header>
  );
}

function resourceFor(domain, page) {
  if (domain === "police") {
    if (page === "reports") return "policeReports";
    if (page === "warrants") return "policeWarrants";
    if (page === "fines") return "policeFines";
    if (page === "callsigns") return null;
  }
  if (domain === "ems" && page === "reports") return "emsRecords";
  if (domain === "court") {
    if (page === "cases") return "courtCases";
    if (page === "documents") return "courtCases";
  }
  return null;
}

function Header({ title, description, children }) {
  return (
    <div>
      <p className="text-sm font-black uppercase tracking-wide text-a2-green">Secure workspace</p>
      <h1 className="mt-2 text-3xl font-black">{title}</h1>
      <p className="mt-2 max-w-3xl text-white/55">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
