import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { Search, Upload } from "lucide-react";
import { API_BASE, api } from "../lib/api.js";
import { uploadGalleryImageToCloudinary, cloudinaryUploadsEnabled } from "../lib/cloudinaryUpload.js";
import { useApi } from "../lib/useApi.js";
import { useApp } from "../context/AppContext.jsx";
import { Button } from "../components/Button.jsx";
import { Card } from "../components/Card.jsx";

function showImage(url) {
  if (!url) return "";
  if (String(url).startsWith("/uploads/")) return `${API_BASE}${url}`;
  return url;
}

export function SnapshotsPage() {
  const { user } = useApp();
  const [q, setQ] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, loading, reload } = useApi(() => api.get(`/api/public/gallery${q ? `?q=${encodeURIComponent(q)}` : ""}`), [q], { rows: [] });
  const rows = data?.rows || [];

  const submit = async (event) => {
    event.preventDefault();
    setStatus("");
    if (!user) return setStatus("Login required before uploading a picture.");
    if (!file) return setStatus("Choose one picture first.");
    try {
      setBusy(true);
      const hostedUrl = cloudinaryUploadsEnabled() ? await uploadGalleryImageToCloudinary(file) : null;
      if (hostedUrl) {
        await api.post("/api/public/gallery", { image_url: hostedUrl });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        await api.upload("/api/public/gallery", formData);
      }
      setFile(null);
      setStatus("Picture sent. Admin must approve it before it appears.");
      reload?.();
    } catch (error) {
      setStatus(error?.message || "Upload failed. Check Cloudinary settings or backend logs.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <p className="text-sm font-black uppercase tracking-widest text-a2-green">City snapshots</p>
      <h1 className="mt-2 text-4xl font-black md:text-6xl">Gallery</h1>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-center gap-2 rounded-lg border border-a2-border bg-white/[0.04] px-3 py-2">
            <Search size={18} className="text-white/35" />
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search..." />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(loading ? Array.from({ length: 6 }) : rows).map((row, index) => loading ? <Card key={index}><div className="h-52 rounded skeleton" /></Card> : (
              <Link key={row.id} to={`/gallery/${row.id}`}>
                <Card className="overflow-hidden p-0 transition hover:border-a2-green/50">
                  <img src={showImage(row.image_url)} alt="" className="h-56 w-full object-cover" />
                  <div className="p-4"><p className="text-sm font-bold text-white/65">Uploaded by {row.uploader_username || "Unknown"}</p></div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        <Card>
          <Upload className="mb-3 text-a2-green" size={28} />
          <h2 className="text-xl font-black">Upload a picture</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">Only pictures are accepted. No title or text is added. Admin approval is required.</p>
          <p className="mt-2 rounded-lg border border-a2-border bg-white/[0.04] p-3 text-xs text-white/45">Status: waiting for review after upload. Approved pictures appear in the public gallery.</p>
          <form className="mt-4 grid gap-3" onSubmit={submit}>
            <input className="form-input" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <Button type="submit" disabled={busy}>{busy ? "Uploading..." : "Send for approval"}</Button>
            {status && <p className="text-sm text-a2-green">{status}</p>}
          </form>
        </Card>
      </div>
    </main>
  );
}

export function SnapshotDetailPage() {
  const { id } = useParams();
  const { data, loading } = useApi(() => api.get(`/api/public/gallery/${id}`), [id], { row: null });
  const row = data?.row;
  if (loading) return <main className="mx-auto max-w-4xl px-4 py-12"><Card><div className="h-80 rounded skeleton" /></Card></main>;
  if (!row) return <main className="px-4 py-20 text-center text-white/60">Picture not found.</main>;
  return <main className="mx-auto max-w-5xl px-4 py-12"><Link to="/gallery" className="text-sm font-bold text-a2-green">Back to Gallery</Link><Card className="mt-5 overflow-hidden p-0"><img src={showImage(row.image_url)} alt="" className="max-h-[72vh] w-full object-contain bg-black" /><div className="grid gap-2 border-t border-a2-border p-5 text-sm text-white/65"><p><b>Uploader:</b> {row.uploader_username || "Unknown"}</p><p><b>Discord ID:</b> {row.uploader_discord_id || "Not linked"}</p><p><b>User ID:</b> {row.submitted_by || "Unknown"}</p></div></Card></main>;
}
