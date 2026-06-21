import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Filter } from "lucide-react";
import { api, imageFallback } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { publicCollections } from "../data/modules.js";
import { Card } from "../components/Card.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";

export function PublicCollection({ type }) {
  const config = publicCollections[type] || publicCollections.news;
  const { data, loading } = useApi(() => api.get(`/api/public/${config.api}`), [config.api], { rows: [] });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-a2-green"><Filter size={15} /> {config.singular}</p>
          <h1 className="text-4xl font-black">{config.title}</h1>
          <p className="mt-3 max-w-2xl text-white/55">{config.description}</p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {(loading ? Array.from({ length: 6 }) : data?.rows || []).map((row, index) => (
          <Link key={row?.id || index} to={`/${type}/${row?.id || ""}`} className="group">
            <Card className="h-full overflow-hidden p-0">
              {loading ? <div className="h-44 skeleton" /> : <img className="h-44 w-full object-cover opacity-78 transition group-hover:opacity-100" src={row.image_url || row.banner_url || row.profile_image_url || imageFallback(row.title || row.name || row.character_name || config.title)} alt="" loading="lazy" />}
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-white/42">{row.category || row.business_type || row.marker_type || row.week_number || config.singular}</p>
                  <StatusBadge status={row.status || (row.is_approved ? "Approved" : "Published")} />
                </div>
                <h2 className="text-xl font-black">{row.title || row.name || row.character_name || row.display_name || "Untitled"}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">{row.description || row.subtitle || row.content || row.backstory || row.story_summary || "No description yet."}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function PublicDetail({ type }) {
  const { id } = useParams();
  const config = publicCollections[type] || publicCollections.news;
  const { data, loading, error } = useApi(() => api.get(`/api/public/${config.api}/${id}`), [config.api, id], null);
  const row = data?.row || {};

  if (error) return <main className="mx-auto max-w-4xl px-4 py-16"><Card>Could not find this {config.singular.toLowerCase()}.</Card></main>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link to={`/${type}`} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-a2-green"><ArrowLeft size={16} /> Back to {config.title}</Link>
      <Card className="overflow-hidden p-0">
        {loading ? <div className="h-72 skeleton" /> : <img className="h-72 w-full object-cover opacity-80" src={row.image_url || row.banner_url || row.profile_image_url || imageFallback(row.title || row.name || config.title, 1200, 520)} alt="" />}
        <div className="p-6">
          <StatusBadge status={row.status || "Published"} />
          <h1 className="mt-4 text-4xl font-black">{row.title || row.name || row.character_name || "Untitled"}</h1>
          <p className="mt-4 whitespace-pre-line leading-8 text-white/65">{row.content || row.description || row.backstory || row.story_summary || "This page is ready for CMS content."}</p>
        </div>
      </Card>
    </main>
  );
}
