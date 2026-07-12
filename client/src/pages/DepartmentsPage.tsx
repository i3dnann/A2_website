import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Ambulance,
  BadgeCheck,
  Building2,
  Camera,
  Car,
  ClipboardList,
  Edit3,
  Eye,
  Filter,
  Loader2,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Users,
  X
} from "lucide-react";
import { api, upload as uploadApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PageShell from "../components/PageShell";
import { CardSkeleton, useToast } from "../components/Toast";

type Department = {
  id: string;
  slug: "ems" | "police" | "fib";
  name: string;
  shortName: string;
  description: string;
  logoUrl?: string;
  headerImageUrl?: string;
  accentStyle: string;
};

type DepartmentAccess = {
  authenticated: boolean;
  roles: string[];
  canViewMemberArea: boolean;
  canManage: boolean;
  canAssignManagement: boolean;
};

type Rank = {
  id: string;
  name: string;
  short_name?: string;
  hierarchy_level?: number;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
};

type Wing = {
  id: string;
  name: string;
  short_code?: string;
  description?: string;
  image_url?: string;
  display_order?: number;
  is_active?: boolean;
};

type Employee = {
  id: string;
  user_id?: string;
  discord_user_id?: string;
  discord_username?: string;
  display_name?: string;
  character_name?: string;
  profile_image_url?: string;
  unit_code?: string;
  rank_id?: string;
  rank_name?: string;
  primary_wing_id?: string;
  primary_wing_name?: string;
  wings: { id: string; name: string; short_code?: string }[];
  employment_status: string;
  public_biography?: string;
  display_order?: number;
  hired_at?: string | null;
};

type Uniform = {
  id: string;
  category?: string;
  title: string;
  description?: string;
  image_url?: string;
  gender?: string;
  component_data?: unknown;
  display_order?: number;
  is_published?: boolean;
};

type Vehicle = {
  id: string;
  name: string;
  model_code?: string;
  category?: string;
  description?: string;
  image_url?: string;
  minimum_rank_id?: string;
  minimum_rank_name?: string;
  required_wing_id?: string;
  required_wing_name?: string;
  display_order?: number;
  is_published?: boolean;
};

type AuditLog = {
  id: string;
  actor_name?: string;
  actor_user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  created_at: string;
};

type DataState = {
  department: Department | null;
  access: DepartmentAccess;
  employees: Employee[];
  ranks: Rank[];
  wings: Wing[];
  uniforms: Uniform[];
  vehicles: Vehicle[];
  logs: AuditLog[];
};

const DEPARTMENT_META = {
  ems: { icon: Ambulance, tone: "#ef4444", label: "Medical response" },
  police: { icon: Shield, tone: "#3b82f6", label: "Public safety" },
  fib: { icon: Building2, tone: "#c9a84a", label: "Federal bureau" }
} as const;

const emptyAccess: DepartmentAccess = {
  authenticated: false,
  roles: [],
  canViewMemberArea: false,
  canManage: false,
  canAssignManagement: false
};

const statusOptions = ["Active", "Off duty", "Leave of absence", "Suspended", "Retired"];

export default function DepartmentsPage() {
  const { department: slugParam } = useParams();
  const slug = String(slugParam || "").toLowerCase() as Department["slug"];
  const isKnown = ["ems", "police", "fib"].includes(slug);

  if (!isKnown) return <DepartmentsHub />;
  return <DepartmentDetail slug={slug} />;
}

function DepartmentsHub() {
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<{ departments: Department[] }>("/api/departments")
      .then((response) => { if (!cancelled) setDepartments(response.departments || []); })
      .catch(() => setDepartments([]))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <PageShell subtitle="Public Departments" title="Departments">
      <p className="mx-auto -mt-8 mb-10 max-w-2xl text-center text-sm leading-7 text-white/55">
        {t("View Gotham City department rosters, ranks, divisions, uniforms, and vehicles. Management tools appear only for authorized department leadership.")}
      </p>
      {loading ? (
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <CardSkeleton key={index} />)}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {departments.map((department) => {
            const meta = DEPARTMENT_META[department.slug] || DEPARTMENT_META.police;
            const Icon = meta.icon;
            return (
              <Link
                key={department.slug}
                to={`/departments/${department.slug}`}
                className="spotlight-card group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-white/20"
                style={{ "--spotlight-card-color": meta.tone } as CSSProperties}
              >
                <div className="absolute inset-x-0 top-0 h-24 opacity-30" style={{ background: `radial-gradient(circle at 50% 0%, ${meta.tone}, transparent 65%)` }} />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-white">
                  <Icon size={26} />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-white/35">{meta.label}</p>
                <h2 className="mt-2 font-serif text-2xl text-white">{department.shortName}</h2>
                <p className="mt-3 min-h-20 text-sm leading-7 text-white/58">{department.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-300">
                  {t("Open department")} <Eye size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function DepartmentDetail({ slug }: { slug: Department["slug"] }) {
  const { t } = useLanguage();
  const { user, loginDiscord } = useAuth();
  const { push, confirm } = useToast();
  const location = useLocation();
  const [data, setData] = useState<DataState>({
    department: null,
    access: emptyAccess,
    employees: [],
    ranks: [],
    wings: [],
    uniforms: [],
    vehicles: [],
    logs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(location.pathname.endsWith("/manage") ? "manage" : "employees");
  const [query, setQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [wingFilter, setWingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [galleryFilter, setGalleryFilter] = useState("");
  const [lightbox, setLightbox] = useState<{ title: string; image: string } | null>(null);

  const load = async (includeLogs = false) => {
    setLoading(true);
    setError("");
    try {
      const [department, access, employees, ranks, wings, uniforms, vehicles] = await Promise.all([
        api<{ department: Department }>(`/api/departments/${slug}`),
        api<{ access: DepartmentAccess }>(`/api/departments/${slug}/access`),
        api<{ employees: Employee[] }>(`/api/departments/${slug}/employees`),
        api<{ ranks: Rank[] }>(`/api/departments/${slug}/ranks`),
        api<{ wings: Wing[] }>(`/api/departments/${slug}/wings`),
        api<{ uniforms: Uniform[] }>(`/api/departments/${slug}/uniforms`),
        api<{ vehicles: Vehicle[] }>(`/api/departments/${slug}/vehicles`)
      ]);
      let logs: AuditLog[] = data.logs;
      if (includeLogs || access.access?.canManage) {
        try {
          logs = (await api<{ logs: AuditLog[] }>(`/api/departments/${slug}/audit-log`)).logs || [];
        } catch {
          logs = [];
        }
      }
      setData({
        department: department.department,
        access: access.access || emptyAccess,
        employees: employees.employees || [],
        ranks: ranks.ranks || [],
        wings: wings.wings || [],
        uniforms: uniforms.uniforms || [],
        vehicles: vehicles.vehicles || [],
        logs
      });
    } catch (err: any) {
      setError(err?.message || "Could not load department.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user?.id]);

  const department = data.department;
  const meta = DEPARTMENT_META[slug];
  const Icon = meta.icon;

  const filteredEmployees = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.employees.filter((employee) => {
      const searchable = `${employee.character_name || ""} ${employee.display_name || ""} ${employee.discord_username || ""} ${employee.unit_code || ""}`.toLowerCase();
      const bySearch = !needle || searchable.includes(needle);
      const byRank = !rankFilter || employee.rank_id === rankFilter;
      const byWing = !wingFilter || employee.primary_wing_id === wingFilter || employee.wings.some((wing) => wing.id === wingFilter);
      const byStatus = !statusFilter || employee.employment_status === statusFilter;
      return bySearch && byRank && byWing && byStatus;
    });
  }, [data.employees, query, rankFilter, wingFilter, statusFilter]);

  const filteredUniforms = useMemo(() => {
    const category = galleryFilter.trim().toLowerCase();
    return data.uniforms.filter((item) => !category || String(item.category || "").toLowerCase() === category);
  }, [data.uniforms, galleryFilter]);

  const filteredVehicles = useMemo(() => {
    const needle = galleryFilter.trim().toLowerCase();
    return data.vehicles.filter((vehicle) => !needle || `${vehicle.category || ""} ${vehicle.name} ${vehicle.model_code || ""}`.toLowerCase().includes(needle));
  }, [data.vehicles, galleryFilter]);

  if (loading && !department) {
    return (
      <PageShell subtitle="Departments" title="Loading">
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={index} />)}
        </div>
      </PageShell>
    );
  }

  if (error || !department) {
    return (
      <PageShell subtitle="Departments" title="Department unavailable">
        <div className="spotlight-card rounded-2xl border border-red-400/20 bg-red-500/5 p-8 text-center text-red-100">
          {error || t("This department could not be loaded.")}
        </div>
      </PageShell>
    );
  }

  return (
    <section className="relative min-h-screen pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="spotlight-card relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 sm:p-8"
          style={{ "--spotlight-card-color": meta.tone } as CSSProperties}
        >
          <div className="absolute inset-0 opacity-35" style={{ background: `radial-gradient(circle at 20% 0%, ${meta.tone}55, transparent 42%), linear-gradient(135deg, rgba(96,81,155,.18), transparent 55%)` }} />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/60">
                <Icon size={16} style={{ color: meta.tone }} /> {department.shortName}
              </div>
              <h1 className="mt-5 font-serif text-4xl text-white sm:text-6xl">{department.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62 sm:text-base">{department.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {!user ? (
                <button onClick={loginDiscord} className="rounded-xl bg-[#60519b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7868b8]">
                  {t("Department login")}
                </button>
              ) : data.access.canManage ? (
                <button onClick={() => setTab("manage")} className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100">
                  <ShieldCheck size={16} /> {t("Management")}
                </button>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/30 px-5 py-3 text-sm text-white/58">
                  {data.access.canViewMemberArea ? t("Member access active") : t("Signed in without management access")}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ["employees", "Employees", Users],
            ["uniforms", "Uniforms", Camera],
            ["vehicles", "Vehicles", Car],
            ...(data.access.canManage ? [["manage", "Manage", ClipboardList] as const] : [])
          ].map(([id, label, TabIcon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                tab === id ? "border-orange-400/40 bg-orange-400/10 text-orange-100" : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
              }`}
            >
              <TabIcon size={15} /> {t(label)}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "employees" && (
            <DirectorySection
              employees={filteredEmployees}
              ranks={data.ranks}
              wings={data.wings}
              query={query}
              setQuery={setQuery}
              rankFilter={rankFilter}
              setRankFilter={setRankFilter}
              wingFilter={wingFilter}
              setWingFilter={setWingFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              canManage={data.access.canManage}
              onManage={() => setTab("manage")}
            />
          )}
          {tab === "uniforms" && (
            <GallerySection
              title="Uniform and clothing gallery"
              empty="No uniforms have been published yet."
              items={filteredUniforms.map((item) => ({
                id: item.id,
                title: item.title,
                subtitle: [item.category, item.gender].filter(Boolean).join(" • "),
                description: item.description || "",
                image: item.image_url || ""
              }))}
              filter={galleryFilter}
              setFilter={setGalleryFilter}
              onPreview={setLightbox}
            />
          )}
          {tab === "vehicles" && (
            <GallerySection
              title="Department vehicle gallery"
              empty="No vehicles have been published yet."
              items={filteredVehicles.map((item) => ({
                id: item.id,
                title: item.name,
                subtitle: [item.model_code, item.category].filter(Boolean).join(" • "),
                description: [item.description, item.minimum_rank_name ? `Minimum rank: ${item.minimum_rank_name}` : "", item.required_wing_name ? `Wing: ${item.required_wing_name}` : ""].filter(Boolean).join("\n"),
                image: item.image_url || ""
              }))}
              filter={galleryFilter}
              setFilter={setGalleryFilter}
              onPreview={setLightbox}
            />
          )}
          {tab === "manage" && (
            data.access.canManage ? (
              <ManagementPanel
                slug={slug}
                department={department}
                data={data}
                reload={() => load(true)}
                push={push}
                confirm={confirm}
              />
            ) : (
              <div className="spotlight-card rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/62">
                {t("You are signed in, but you do not have permission to manage this department.")}
              </div>
            )
          )}
        </div>
      </div>

      {lightbox && (
        <button className="fixed inset-0 z-[180] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)} aria-label="Close image preview">
          <span className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 p-2 text-white"><X size={18} /></span>
          <img src={lightbox.image} alt={lightbox.title} className="max-h-[86vh] max-w-[92vw] rounded-2xl border border-white/10 object-contain shadow-2xl" />
        </button>
      )}
    </section>
  );
}

function DirectorySection({
  employees,
  ranks,
  wings,
  query,
  setQuery,
  rankFilter,
  setRankFilter,
  wingFilter,
  setWingFilter,
  statusFilter,
  setStatusFilter,
  canManage,
  onManage
}: {
  employees: Employee[];
  ranks: Rank[];
  wings: Wing[];
  query: string;
  setQuery: (value: string) => void;
  rankFilter: string;
  setRankFilter: (value: string) => void;
  wingFilter: string;
  setWingFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  canManage: boolean;
  onManage: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="spotlight-card rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search name, Discord, or unit code")} className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-orange-400/45" />
          </label>
          <Select value={rankFilter} onChange={setRankFilter} label="All ranks" options={ranks.map((rank) => ({ value: rank.id, label: rank.name }))} />
          <Select value={wingFilter} onChange={setWingFilter} label="All wings" options={wings.map((wing) => ({ value: wing.id, label: wing.name }))} />
          <Select value={statusFilter} onChange={setStatusFilter} label="All statuses" options={statusOptions.map((status) => ({ value: status, label: status }))} />
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
          <Users className="mx-auto text-white/20" size={36} />
          <p className="mt-4 font-serif text-xl text-white">{t("No employees to show")}</p>
          <p className="mt-2 text-sm text-white/45">{t("Management can add real department members when ready.")}</p>
        </div>
      ) : (
        <>
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-white/35">
                <tr>
                  <th className="px-5 py-4">{t("Employee")}</th>
                  <th className="px-5 py-4">{t("Unit")}</th>
                  <th className="px-5 py-4">{t("Rank")}</th>
                  <th className="px-5 py-4">{t("Wings")}</th>
                  <th className="px-5 py-4">{t("Status")}</th>
                  {canManage && <th className="px-5 py-4 text-right">{t("Actions")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {employees.map((employee) => (
                  <tr key={employee.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <EmployeeIdentity employee={employee} />
                    </td>
                    <td className="px-5 py-4 font-mono text-white/70">{employee.unit_code || "—"}</td>
                    <td className="px-5 py-4 text-white/70">{employee.rank_name || t("Unassigned")}</td>
                    <td className="px-5 py-4"><WingBadges employee={employee} /></td>
                    <td className="px-5 py-4"><StatusBadge status={employee.employment_status} /></td>
                    {canManage && <td className="px-5 py-4 text-right"><button onClick={onManage} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white">{t("Manage")}</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-4 lg:hidden">
            {employees.map((employee) => (
              <article key={employee.id} className="spotlight-card rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <EmployeeIdentity employee={employee} />
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <InfoPill label="Unit" value={employee.unit_code || "—"} />
                  <InfoPill label="Rank" value={employee.rank_name || "Unassigned"} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <WingBadges employee={employee} />
                  <StatusBadge status={employee.employment_status} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GallerySection({
  title,
  empty,
  items,
  filter,
  setFilter,
  onPreview
}: {
  title: string;
  empty: string;
  items: { id: string; title: string; subtitle?: string; description?: string; image?: string }[];
  filter: string;
  setFilter: (value: string) => void;
  onPreview: (item: { title: string; image: string }) => void;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="font-serif text-2xl text-white">{t(title)}</h2>
        <label className="relative w-full sm:w-80">
          <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={t("Filter category")} className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-orange-400/45" />
        </label>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-white/45">{t(empty)}</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="spotlight-card overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <button disabled={!item.image} onClick={() => item.image && onPreview({ title: item.title, image: item.image })} className="block aspect-[16/10] w-full bg-black/35 text-left">
                {item.image ? (
                  <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/20"><Camera size={34} /></div>
                )}
              </button>
              <div className="p-5">
                {item.subtitle && <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">{item.subtitle}</p>}
                <h3 className="mt-2 font-serif text-xl text-white">{item.title}</h3>
                {item.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/58">{item.description}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ManagementPanel({
  slug,
  department,
  data,
  reload,
  push,
  confirm
}: {
  slug: string;
  department: Department;
  data: DataState;
  reload: () => Promise<void>;
  push: ReturnType<typeof useToast>["push"];
  confirm: ReturnType<typeof useToast>["confirm"];
}) {
  const { t } = useLanguage();
  const [section, setSection] = useState("employees");

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        {[
          ["employees", "Employees", Users],
          ["roles", "Member access", ShieldCheck],
          ["ranks", "Ranks", BadgeCheck],
          ["wings", "Wings", Building2],
          ["uniforms", "Clothing", Camera],
          ["vehicles", "Vehicles", Car],
          ["audit", "Audit log", ClipboardList]
        ].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setSection(id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${section === id ? "bg-orange-400/10 text-orange-100" : "text-white/58 hover:bg-white/[0.04] hover:text-white"}`}>
            <Icon size={16} /> {t(label)}
          </button>
        ))}
      </aside>

      <div className="min-w-0">
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/35">{t("Managing")}</p>
          <h2 className="mt-2 font-serif text-2xl text-white">{department.name}</h2>
          <p className="mt-2 text-sm text-white/50">{t("All saves are checked by the backend and recorded in the department audit log.")}</p>
        </div>
        {section === "employees" && <EmployeeManager slug={slug} data={data} reload={reload} push={push} confirm={confirm} />}
        {section === "roles" && <RoleManager slug={slug} access={data.access} push={push} />}
        {section === "ranks" && <SimpleCatalogManager slug={slug} kind="ranks" rows={data.ranks} reload={reload} push={push} confirm={confirm} />}
        {section === "wings" && <SimpleCatalogManager slug={slug} kind="wings" rows={data.wings} reload={reload} push={push} confirm={confirm} />}
        {section === "uniforms" && <MediaManager slug={slug} kind="uniforms" rows={data.uniforms} ranks={data.ranks} wings={data.wings} reload={reload} push={push} confirm={confirm} />}
        {section === "vehicles" && <MediaManager slug={slug} kind="vehicles" rows={data.vehicles} ranks={data.ranks} wings={data.wings} reload={reload} push={push} confirm={confirm} />}
        {section === "audit" && <AuditLog logs={data.logs} />}
      </div>
    </div>
  );
}

function EmployeeManager({ slug, data, reload, push, confirm }: { slug: string; data: DataState; reload: () => Promise<void>; push: ReturnType<typeof useToast>["push"]; confirm: ReturnType<typeof useToast>["confirm"] }) {
  const blank = { lookup: "", character_name: "", display_name: "", discord_user_id: "", discord_username: "", unit_code: "", rank_id: "", primary_wing_id: "", employment_status: "Active", public_biography: "", profile_image_url: "", wing_ids: [] as string[] };
  const [form, setForm] = useState<any>(blank);
  const [editing, setEditing] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await api(`/api/departments/${slug}/employees/${editing}`, { method: "PATCH", body: form });
      else await api(`/api/departments/${slug}/employees`, { method: "POST", body: form });
      push({ kind: "success", message: editing ? "Employee updated." : "Employee added." });
      setForm(blank);
      setEditing("");
      await reload();
    } catch (error: any) {
      push({ kind: "error", message: error?.message || "Employee save failed." });
    } finally {
      setSaving(false);
    }
  };

  const edit = (employee: Employee) => {
    setEditing(employee.id);
    setForm({
      lookup: employee.user_id || employee.discord_user_id || "",
      character_name: employee.character_name || "",
      display_name: employee.display_name || "",
      discord_user_id: employee.discord_user_id || "",
      discord_username: employee.discord_username || "",
      unit_code: employee.unit_code || "",
      rank_id: employee.rank_id || "",
      primary_wing_id: employee.primary_wing_id || "",
      employment_status: employee.employment_status || "Active",
      public_biography: employee.public_biography || "",
      profile_image_url: employee.profile_image_url || "",
      wing_ids: employee.wings.map((wing) => wing.id)
    });
  };

  const remove = async (employee: Employee) => {
    const ok = await confirm({ title: "Retire employee?", message: "This removes department access and safely retires the public record.", confirmText: "Retire" });
    if (!ok) return;
    try {
      await api(`/api/departments/${slug}/employees/${employee.id}`, { method: "DELETE" });
      push({ kind: "success", message: "Employee retired." });
      await reload();
    } catch (error: any) {
      push({ kind: "error", message: error?.message || "Could not remove employee." });
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <FormCard title={editing ? "Edit employee" : "Add employee"}>
        <Input label="Website user / Discord ID / email" value={form.lookup} onChange={(value) => setForm({ ...form, lookup: value })} />
        <Input label="Character name" value={form.character_name} onChange={(value) => setForm({ ...form, character_name: value })} />
        <Input label="Display name" value={form.display_name} onChange={(value) => setForm({ ...form, display_name: value })} />
        <Input label="Discord user ID" value={form.discord_user_id} onChange={(value) => setForm({ ...form, discord_user_id: value })} />
        <Input label="Discord username" value={form.discord_username} onChange={(value) => setForm({ ...form, discord_username: value })} />
        <Input label="Unit code" value={form.unit_code} onChange={(value) => setForm({ ...form, unit_code: value })} />
        <Input label="Profile image URL" value={form.profile_image_url} onChange={(value) => setForm({ ...form, profile_image_url: value })} />
        <Select value={form.rank_id} onChange={(value) => setForm({ ...form, rank_id: value })} label="Unassigned rank" options={data.ranks.map((rank) => ({ value: rank.id, label: rank.name }))} />
        <Select value={form.primary_wing_id} onChange={(value) => setForm({ ...form, primary_wing_id: value })} label="No primary wing" options={data.wings.map((wing) => ({ value: wing.id, label: wing.name }))} />
        <Select value={form.employment_status} onChange={(value) => setForm({ ...form, employment_status: value })} label="Status" options={statusOptions.map((status) => ({ value: status, label: status }))} />
        <textarea value={form.public_biography} onChange={(event) => setForm({ ...form, public_biography: event.target.value })} placeholder={t("Public biography")} className={inputClass("min-h-24")} />
        <WingPicker wings={data.wings} selected={form.wing_ids} onChange={(wing_ids) => setForm({ ...form, wing_ids })} />
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#60519b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} {editing ? t("Save employee") : t("Add employee")}
          </button>
          {editing && <button onClick={() => { setEditing(""); setForm(blank); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/62">{t("Cancel")}</button>}
        </div>
      </FormCard>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="font-serif text-xl text-white">{t("Directory records")}</h3>
        <div className="mt-4 space-y-3">
          {data.employees.map((employee) => (
            <div key={employee.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-3 sm:flex-row sm:items-center sm:justify-between">
              <EmployeeIdentity employee={employee} />
              <div className="flex gap-2">
                <button onClick={() => edit(employee)} className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white" aria-label="Edit employee"><Edit3 size={15} /></button>
                <button onClick={() => remove(employee)} className="rounded-lg border border-red-400/20 p-2 text-red-200/70 hover:text-red-100" aria-label="Retire employee"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {data.employees.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/45">{t("No employees yet.")}</p>}
        </div>
      </div>
    </div>
  );
}

function RoleManager({ slug, access, push }: { slug: string; access: DepartmentAccess; push: ReturnType<typeof useToast>["push"] }) {
  const [userId, setUserId] = useState("");
  const [lookup, setLookup] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  const search = async () => {
    if (!lookup.trim()) return;
    try {
      const response = await api<{ users: any[] }>(`/api/departments/${slug}/users/search`, { params: { q: lookup } });
      setResults(response.users || []);
      if (response.users?.[0]?.id) setUserId(response.users[0].id);
    } catch (error: any) {
      push({ kind: "error", message: error?.message || "User search failed." });
    }
  };

  const mutate = async (type: "member" | "management", method: "POST" | "DELETE") => {
    if (!userId) return push({ kind: "info", message: "Select or enter a website user ID first." });
    setSaving(true);
    try {
      const path = method === "POST" ? `/api/departments/${slug}/roles/${type}` : `/api/departments/${slug}/roles/${type}/${encodeURIComponent(userId)}`;
      await api(path, { method, body: method === "POST" ? { user_id: userId } : undefined });
      push({ kind: "success", message: "Department role updated." });
    } catch (error: any) {
      push({ kind: "error", message: error?.message || "Role update failed." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormCard title="Member access">
      <p className="text-sm leading-6 text-white/55">{t("Managers can grant or remove regular member access. Only Master Admins can grant or remove management access.")}</p>
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Input label="Find user by website ID, Discord ID, email, or username" value={lookup} onChange={setLookup} />
        <button onClick={search} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 hover:text-white">{t("Search")}</button>
      </div>
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => (
            <button key={result.id} onClick={() => setUserId(result.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${userId === result.id ? "border-orange-400/40 bg-orange-400/10" : "border-white/10 bg-black/20"}`}>
              <Avatar src={result.avatar_url} name={result.username} />
              <span>
                <span className="block text-sm font-semibold text-white">{result.username}</span>
                <span className="block text-xs text-white/45">{result.discord_username || result.discord_id || result.id}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <Input label="Website user ID" value={userId} onChange={setUserId} />
      <div className="flex flex-wrap gap-2">
        <RoleButton disabled={saving} onClick={() => mutate("member", "POST")} label="Grant member" />
        <RoleButton disabled={saving} onClick={() => mutate("member", "DELETE")} label="Remove member" danger />
        {access.canAssignManagement && (
          <>
            <RoleButton disabled={saving} onClick={() => mutate("management", "POST")} label="Grant management" />
            <RoleButton disabled={saving} onClick={() => mutate("management", "DELETE")} label="Remove management" danger />
          </>
        )}
      </div>
    </FormCard>
  );
}

function SimpleCatalogManager({ slug, kind, rows, reload, push, confirm }: { slug: string; kind: "ranks" | "wings"; rows: any[]; reload: () => Promise<void>; push: ReturnType<typeof useToast>["push"]; confirm: ReturnType<typeof useToast>["confirm"] }) {
  const isRank = kind === "ranks";
  const blank = isRank ? { name: "", short_name: "", hierarchy_level: 0, description: "", image_url: "", display_order: 9999, is_active: true } : { name: "", short_code: "", description: "", image_url: "", display_order: 9999, is_active: true };
  const [form, setForm] = useState<any>(blank);
  const [editing, setEditing] = useState("");
  const { t } = useLanguage();

  const save = async () => {
    try {
      await api(`/api/departments/${slug}/${kind}${editing ? `/${editing}` : ""}`, { method: editing ? "PATCH" : "POST", body: form });
      push({ kind: "success", message: `${isRank ? "Rank" : "Wing"} saved.` });
      setEditing("");
      setForm(blank);
      await reload();
    } catch (error: any) {
      push({ kind: "error", message: error?.message || "Save failed." });
    }
  };

  const remove = async (row: any) => {
    const ok = await confirm({ title: `Delete ${isRank ? "rank" : "wing"}?`, message: "This is blocked if employees still use it.", confirmText: "Delete" });
    if (!ok) return;
    try {
      await api(`/api/departments/${slug}/${kind}/${row.id}`, { method: "DELETE" });
      push({ kind: "success", message: "Deleted." });
      await reload();
    } catch (error: any) {
      push({ kind: "error", message: error?.message || "Delete failed." });
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <FormCard title={editing ? `Edit ${isRank ? "rank" : "wing"}` : `Add ${isRank ? "rank" : "wing"}`}>
        <Input label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
        <Input label={isRank ? "Short name" : "Short code"} value={form[isRank ? "short_name" : "short_code"] || ""} onChange={(value) => setForm({ ...form, [isRank ? "short_name" : "short_code"]: value })} />
        {isRank && <Input label="Hierarchy level" type="number" value={String(form.hierarchy_level ?? 0)} onChange={(value) => setForm({ ...form, hierarchy_level: Number(value) })} />}
        <Input label="Image / insignia URL" value={form.image_url || ""} onChange={(value) => setForm({ ...form, image_url: value })} />
        <Input label="Display order" type="number" value={String(form.display_order ?? 9999)} onChange={(value) => setForm({ ...form, display_order: Number(value) })} />
        <textarea value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t("Description")} className={inputClass("min-h-24")} />
        <label className="flex items-center gap-2 text-sm text-white/62"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> {t("Active")}</label>
        <div className="flex gap-2">
          <button onClick={save} className="rounded-xl bg-[#60519b] px-4 py-3 text-sm font-semibold text-white">{t("Save")}</button>
          {editing && <button onClick={() => { setEditing(""); setForm(blank); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60">{t("Cancel")}</button>}
        </div>
      </FormCard>
      <CatalogList rows={rows} onEdit={(row) => { setEditing(row.id); setForm({ ...blank, ...row }); }} onDelete={remove} />
    </div>
  );
}

function MediaManager({ slug, kind, rows, ranks, wings, reload, push, confirm }: { slug: string; kind: "uniforms" | "vehicles"; rows: any[]; ranks: Rank[]; wings: Wing[]; reload: () => Promise<void>; push: ReturnType<typeof useToast>["push"]; confirm: ReturnType<typeof useToast>["confirm"] }) {
  const isVehicle = kind === "vehicles";
  const blank = isVehicle ? { name: "", model_code: "", category: "", description: "", minimum_rank_id: "", required_wing_id: "", display_order: 9999, is_published: true } : { title: "", category: "", description: "", gender: "", component_data: "", display_order: 9999, is_published: true };
  const [form, setForm] = useState<any>(blank);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, typeof value === "object" ? JSON.stringify(value) : String(value ?? "")));
      if (file) fd.append("file", file);
      const path = `/api/departments/${slug}/${kind}${editing ? `/${editing}` : ""}`;
      await uploadApi(path, fd, { method: editing ? "PATCH" : "POST" }).catch(async (error: any) => {
        if (editing && !file) await api(path, { method: "PATCH", body: form });
        else throw error;
      });
      push({ kind: "success", message: `${isVehicle ? "Vehicle" : "Uniform"} saved.` });
      setForm(blank);
      setFile(null);
      setEditing("");
      await reload();
    } catch (error: any) {
      push({ kind: "error", message: error?.message || "Media save failed." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: any) => {
    const ok = await confirm({ title: `Delete ${isVehicle ? "vehicle" : "uniform"}?`, message: "This removes the public gallery record and its Cloudinary image when possible.", confirmText: "Delete" });
    if (!ok) return;
    try {
      await api(`/api/departments/${slug}/${kind}/${row.id}`, { method: "DELETE" });
      push({ kind: "success", message: "Deleted." });
      await reload();
    } catch (error: any) {
      push({ kind: "error", message: error?.message || "Delete failed." });
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <FormCard title={editing ? `Edit ${isVehicle ? "vehicle" : "uniform"}` : `Add ${isVehicle ? "vehicle" : "uniform"}`}>
        <Input label={isVehicle ? "Vehicle name" : "Title"} value={form[isVehicle ? "name" : "title"] || ""} onChange={(value) => setForm({ ...form, [isVehicle ? "name" : "title"]: value })} />
        {isVehicle && <Input label="Model / callsign code" value={form.model_code || ""} onChange={(value) => setForm({ ...form, model_code: value })} />}
        {!isVehicle && <Input label="Gender / model info" value={form.gender || ""} onChange={(value) => setForm({ ...form, gender: value })} />}
        <Input label="Category" value={form.category || ""} onChange={(value) => setForm({ ...form, category: value })} />
        {isVehicle && <Select value={form.minimum_rank_id || ""} onChange={(value) => setForm({ ...form, minimum_rank_id: value })} label="No minimum rank" options={ranks.map((rank) => ({ value: rank.id, label: rank.name }))} />}
        {isVehicle && <Select value={form.required_wing_id || ""} onChange={(value) => setForm({ ...form, required_wing_id: value })} label="No required wing" options={wings.map((wing) => ({ value: wing.id, label: wing.name }))} />}
        <Input label="Display order" type="number" value={String(form.display_order ?? 9999)} onChange={(value) => setForm({ ...form, display_order: Number(value) })} />
        <textarea value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t("Description")} className={inputClass("min-h-24")} />
        <label className="rounded-xl border border-dashed border-white/15 bg-black/20 p-4 text-center text-sm text-white/58">
          <UploadCloud className="mx-auto mb-2 text-white/35" size={24} />
          {file ? file.name : t("Upload image")}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <label className="flex items-center gap-2 text-sm text-white/62"><input type="checkbox" checked={Boolean(form.is_published)} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} /> {t("Published")}</label>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#60519b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving && <Loader2 size={15} className="animate-spin" />} {t("Save")}</button>
          {editing && <button onClick={() => { setEditing(""); setForm(blank); setFile(null); }} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60">{t("Cancel")}</button>}
        </div>
      </FormCard>
      <CatalogList rows={rows} titleKey={isVehicle ? "name" : "title"} onEdit={(row) => { setEditing(row.id); setForm({ ...blank, ...row }); }} onDelete={remove} />
    </div>
  );
}

function AuditLog({ logs }: { logs: AuditLog[] }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="font-serif text-xl text-white">{t("Audit log")}</h3>
      <div className="mt-4 space-y-2">
        {logs.map((log) => (
          <div key={log.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-sm font-semibold text-white">{log.action.replaceAll("_", " ")}</p>
            <p className="mt-1 text-xs text-white/45">{log.entity_type} {log.entity_id || ""} • {log.actor_name || log.actor_user_id || "System"} • {formatDate(log.created_at)}</p>
          </div>
        ))}
        {logs.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/45">{t("No department audit entries yet.")}</p>}
      </div>
    </div>
  );
}

function EmployeeIdentity({ employee }: { employee: Employee }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar src={employee.profile_image_url} name={employee.character_name || employee.display_name || "Employee"} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{employee.character_name || employee.display_name || "Unnamed employee"}</p>
        <p className="truncate text-xs text-white/45">{employee.discord_username || employee.display_name || employee.discord_user_id || "No Discord shown"}</p>
      </div>
    </div>
  );
}

function WingBadges({ employee }: { employee: Employee }) {
  const wings = employee.wings?.length ? employee.wings : employee.primary_wing_name ? [{ id: employee.primary_wing_id || "primary", name: employee.primary_wing_name }] : [];
  if (!wings.length) return <span className="text-sm text-white/35">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {wings.map((wing) => <span key={wing.id} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/65">{wing.short_code || wing.name}</span>)}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "Active" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : status === "Suspended" ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-white/12 bg-white/[0.04] text-white/62";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}

function Avatar({ src, name }: { src?: string; name: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#15101f] text-sm font-bold text-[#d9d0ff]">
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" /> : initials(name)}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p className="mt-1 text-sm text-white/75">{value}</p>
    </div>
  );
}

function Select({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: { value: string; label: string }[] }) {
  const { t } = useLanguage();
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass()}>
      <option value="">{t(label)}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
    </select>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  const { t } = useLanguage();
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={t(label)} className={inputClass()} />;
}

function WingPicker({ wings, selected, onChange }: { wings: Wing[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {wings.map((wing) => (
        <button key={wing.id} type="button" onClick={() => toggle(wing.id)} className={`rounded-full border px-3 py-1.5 text-xs ${selected.includes(wing.id) ? "border-orange-400/40 bg-orange-400/10 text-orange-100" : "border-white/10 text-white/55"}`}>
          {wing.short_code || wing.name}
        </button>
      ))}
    </div>
  );
}

function FormCard({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-serif text-xl text-white">{t(title)}</h3>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

function CatalogList({ rows, onEdit, onDelete, titleKey = "name" }: { rows: any[]; onEdit: (row: any) => void; onDelete: (row: any) => void; titleKey?: string }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="font-serif text-xl text-white">{t("Current records")}</h3>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{row[titleKey] || row.name}</p>
              <p className="truncate text-xs text-white/45">{row.short_name || row.short_code || row.category || row.model_code || (row.is_active === false || row.is_published === false ? "Hidden/inactive" : "Active")}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => onEdit(row)} className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white" aria-label="Edit"><Edit3 size={15} /></button>
              <button onClick={() => onDelete(row)} className="rounded-lg border border-red-400/20 p-2 text-red-200/70 hover:text-red-100" aria-label="Delete"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-white/45">{t("No records yet.")}</p>}
      </div>
    </div>
  );
}

function RoleButton({ label, onClick, disabled, danger = false }: { label: string; onClick: () => void; disabled: boolean; danger?: boolean }) {
  const { t } = useLanguage();
  return (
    <button disabled={disabled} onClick={onClick} className={`rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50 ${danger ? "border border-red-400/25 bg-red-400/10 text-red-100" : "bg-[#60519b] text-white"}`}>
      {t(label)}
    </button>
  );
}

function inputClass(extra = "") {
  return `w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-orange-400/45 ${extra}`;
}

function initials(name: string) {
  return String(name || "?").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
