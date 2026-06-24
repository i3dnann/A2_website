import { useState } from "react";
import { CheckCircle2, RefreshCw, Trash2, Upload, XCircle } from "lucide-react";
import { API_BASE, api } from "../lib/api.js";
import { useApi } from "../lib/useApi.js";
import { uploadGalleryImageToCloudinary, cloudinaryUploadsEnabled } from "../lib/cloudinaryUpload.js";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

function showImage(url) {
  if (!url) return "";
  if (String(url).startsWith("/uploads/")) return `${API_BASE}${url}`;
  return url;
}

function statusClass(status) {
  if (status === "Pending") return "border-a2-warning/50 text-a2-warning";
  if (status === "Denied") return "border-a2-danger/50 text-a2-danger";
  return "border-a2-green/50 text-a2-green";
}

export default function AdminGalleryPage() {
  const [q, setQ] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const { data, loading } = useApi(() => api.get(`/api/admin/gallery?q=${encodeURIComponent(q)}`), [q, refresh], { rows: [] });
  const rows = data?.rows || [];
  const pending = rows.filter((row) => row.status === "Pending").length;
  const reload = () => setRefresh((value) => value + 1);

  const uploadAdmin = async (event) => {
    event.preventDefault();
    setStatus("");
    if (!file) return setStatus("Choose one picture first.");
    try {
      setBusy(true);
      const hostedUrl = cloudinaryUploadsEnabled() ? await uploadGalleryImageToCloudinary(file, "gotham-gallery-admin") : null;
      if (hostedUrl) await api.post("/api/admin/gallery", { image_url: hostedUrl, status: "Approved" });
      else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("status", "Approved");
        await api.upload("/api/admin/gallery", formData);
      }
      setFile(null);
      setStatus("Picture uploaded and approved.");
      reload();
    } catch (error) {
      setStatus(error?.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const review = async (id, nextStatus) => {
    await api.patch(`/api/admin/gallery/${id}`, { status: nextStatus });
    reload();
  };

  const remove = async (id) => {
    await api.delete(`/api/admin/gallery/${id}`, {});
    reload();
  };

  return <div className="grid gap-5"><header><p className="text-sm font-black uppercase tracking-widest text-a2-green">Gallery Review</p><h1 className="mt-2 text-3xl font-black md:text-4xl">Approve or deny pictures</h1>{pending > 0 ? <p className="mt-2 rounded-lg border border-a2-warning/40 bg-a2-warning/10 p-3 text-sm text-a2-warning">{pending} picture(s) waiting for review.</p> : <p className="mt-2 text-sm text-white/55">No pictures are waiting for review.</p>}</header><Card><h2 className="text-xl font-black">Add approved picture</h2><p className="mt-2 text-sm text-white/55">Admin uploads are approved immediately. Public uploads stay pending until reviewed.</p><form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={uploadAdmin}><input className="form-input" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /><Button type="submit" disabled={busy}><Upload size={15} /> {busy ? "Uploading..." : "Upload approved"}</Button>{status && <p className="text-sm text-a2-green md:col-span-2">{status}</p>}</form></Card><Card><div className="mb-4 flex items-center gap-2"><input className="form-input" placeholder="Search uploader, Discord ID, or status..." value={q} onChange={(event) => setQ(event.target.value)} /><Button type="button" variant="ghost" onClick={reload}><RefreshCw size={15} /></Button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(loading ? Array.from({ length: 6 }) : rows).map((row, index) => loading ? <div key={index} className="h-64 rounded skeleton" /> : <div key={row.id} className="overflow-hidden rounded-xl border border-a2-border bg-white/[0.04]"><img src={showImage(row.image_url)} alt="" className="h-56 w-full object-contain bg-black" /><div className="grid gap-2 p-4 text-sm text-white/65"><span className={`w-fit rounded-full border px-2 py-1 text-xs font-black ${statusClass(row.status)}`}>{row.status}</span>{row.status === "Pending" && <p className="rounded-lg border border-a2-warning/35 bg-a2-warning/10 p-2 text-xs text-a2-warning">Waiting for admin review. Review the image before approving or denying.</p>}<p><b>Requested by:</b> {row.uploader_username || "Unknown"}</p><p><b>Discord ID:</b> {row.uploader_discord_id || "Not linked"}</p><p><b>User ID:</b> {row.submitted_by || "Unknown"}</p><div className="mt-2 flex flex-wrap gap-2"><Button type="button" onClick={() => review(row.id, "Approved")}><CheckCircle2 size={14} /> Approve</Button><Button type="button" variant="ghost" onClick={() => review(row.id, "Denied")}><XCircle size={14} /> Deny</Button><Button type="button" variant="danger" onClick={() => remove(row.id)}><Trash2 size={14} /> Delete</Button></div></div></div>)}</div>{!loading && !rows.length && <p className="py-8 text-center text-sm text-white/45">No pictures yet.</p>}</Card></div>;
}
