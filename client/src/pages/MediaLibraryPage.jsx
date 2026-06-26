import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Trash2, Copy, Check, Image, File, X, Loader2, Music, Video, Eye } from "lucide-react";
import { apiUrl } from "../lib/api.js";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/aac", "audio/flac"];
const VIDEO_TYPES = ["video/mp4", "video/x-m4v", "video/webm", "video/quicktime"];

function formatBytes(bytes = 0) {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isAbsoluteUrl(value = "") {
  return /^https?:\/\//i.test(String(value));
}

function normalizeMediaUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (isAbsoluteUrl(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
  if (raw.startsWith("/")) return apiUrl(raw);
  return apiUrl(`/uploads/${encodeURIComponent(raw)}`);
}

function fileUrl(file = {}) {
  const direct = file.url || file.image_url || file.file_url;
  if (direct) return normalizeMediaUrl(direct);
  const key = file.blob_key || file.stored_name;
  // The media API is served by this site's own Netlify Functions, so it must
  // stay same-origin, matching the bare /api/media/* fetches for upload, list,
  // and delete. Routing it through apiUrl() would point it at the external
  // backend (VITE_API_BASE_URL), which has no /api/media/file route.
  if (key) return `/api/media/file?key=${encodeURIComponent(key)}`;
  return "";
}

function mediaKind(file = {}) {
  const mime = String(file.mime_type || file.mimetype || file.type || "").toLowerCase();
  const name = String(file.original_name || file.name || file.url || file.stored_name || "").toLowerCase();
  if (mime.startsWith("image/") || IMAGE_TYPES.includes(mime) || /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/.test(name)) return "image";
  if (mime.startsWith("audio/") || AUDIO_TYPES.includes(mime) || /\.(mp3|wav|ogg|oga|m4a|aac|flac)(\?.*)?$/.test(name)) return "audio";
  if (mime.startsWith("video/") || VIDEO_TYPES.includes(mime) || /\.(mp4|m4v|webm|mov)(\?.*)?$/.test(name)) return "video";
  return "file";
}

function displayName(file = {}) {
  return file.original_name || file.name || file.stored_name || file.blob_key || "Untitled file";
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="rounded p-1 text-white/45 hover:text-white transition" title="Copy URL" type="button">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

function MediaPreviewModal({ file, onClose }) {
  if (!file) return null;
  const kind = mediaKind(file);
  const url = fileUrl(file);
  const name = displayName(file);

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/88 p-4" onClick={onClose}>
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#08080d] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{name}</p>
            <p className="text-xs text-white/45">{formatBytes(file.size || file.size_bytes || 0)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-bold text-white/70 hover:text-white">Close</button>
        </div>
        <div className="grid max-h-[78vh] place-items-center overflow-auto bg-black p-4">
          {kind === "image" ? (
            <img src={url} alt={name} className="max-h-[74vh] max-w-full rounded-lg object-contain" />
          ) : kind === "video" ? (
            <video src={url} controls className="max-h-[74vh] max-w-full rounded-lg" />
          ) : kind === "audio" ? (
            <audio src={url} controls className="w-full max-w-2xl" />
          ) : (
            <a href={url} target="_blank" rel="noreferrer" className="rounded-lg bg-a2-green px-4 py-2 font-black text-black">Open file</a>
          )}
        </div>
      </div>
    </div>
  );
}

function FileCard({ file, onDelete, onPreview }) {
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const kind = mediaKind(file);
  const name = displayName(file);
  const url = fileUrl(file);
  const absoluteUrl = isAbsoluteUrl(url) ? url : window.location.origin + url;

  const handleDelete = async () => {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: file.id }),
      });
      if (res.ok) onDelete(file.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111116] shadow-lg transition hover:border-white/25">
      <button type="button" onClick={() => onPreview(file)} className="block w-full text-left">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/60">
          {kind === "image" && !failed ? (
            <img src={url} alt={name} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
          ) : kind === "video" && !failed ? (
            <video src={url} muted preload="metadata" onError={() => setFailed(true)} className="h-full w-full object-cover" />
          ) : kind === "audio" ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-white/45"><Music size={42} /><span className="text-xs font-bold uppercase tracking-widest">Audio</span></div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-white/35"><File size={42} /><span className="line-clamp-2 text-xs font-bold">Preview unavailable</span></div>
          )}
          <div className="absolute right-2 top-2 rounded-full bg-black/62 p-2 text-white opacity-0 transition group-hover:opacity-100"><Eye size={15} /></div>
        </div>
      </button>
      {kind === "audio" && <audio src={url} controls preload="none" className="w-full px-2 py-2" />}
      <div className="p-3">
        <p className="line-clamp-2 min-h-[2.25rem] text-sm font-black leading-tight text-white" title={name}>{name}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-white/40">{formatBytes(file.size || file.size_bytes || 0)}</span>
          <div className="flex items-center gap-1">
            <CopyButton text={absoluteUrl} />
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded p-1 text-white/45 transition hover:text-red-400 disabled:opacity-40"
              title="Delete"
              type="button"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadZone({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState([]);
  const inputRef = useRef(null);

  const uploadFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setUploading(true);
    setProgress(files.map((f) => ({ name: f.name, status: "pending" })));

    const results = [];
    for (let i = 0; i < files.length; i++) {
      setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: "uploading" } : p));
      const formData = new FormData();
      formData.append("file", files[i]);
      try {
        const res = await fetch("/api/media/upload", { method: "POST", body: formData, credentials: "include" });
        if (res.ok) {
          const record = await res.json();
          results.push(record);
          setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: "done" } : p));
        } else {
          setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: "error" } : p));
        }
      } catch {
        setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: "error" } : p));
      }
    }

    onUploaded(results);
    setTimeout(() => {
      setUploading(false);
      setProgress([]);
    }, 1200);
  }, [onUploaded]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${dragging ? "border-a2-green bg-a2-green/10" : "border-white/15 hover:border-white/30 hover:bg-white/3"}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*,.pdf,.txt,.json,.mp3,.wav,.ogg,.m4a,.aac,.flac,.mp4,.webm,.mov,.m4v"
          className="hidden"
          onChange={(e) => uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="space-y-1.5">
            {progress.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
                <span className="truncate text-white/70">{p.name}</span>
                {p.status === "uploading" && <Loader2 size={14} className="animate-spin text-a2-green shrink-0" />}
                {p.status === "done" && <Check size={14} className="text-green-400 shrink-0" />}
                {p.status === "error" && <X size={14} className="text-red-400 shrink-0" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <Upload size={32} />
            <div>
              <p className="font-semibold text-white/65">Drop files here or click to browse</p>
              <p className="text-sm mt-0.5">Images, long audio, videos, PDFs, TXT, and JSON files</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetch("/api/media/list", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setFiles(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const handleUploaded = (newFiles) => {
    setFiles((prev) => [...newFiles, ...prev]);
  };

  const handleDelete = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const filtered = files.filter((file) => filter === "all" || mediaKind(file) === filter.slice(0, -1));

  const imageCount = files.filter((f) => mediaKind(f) === "image").length;
  const audioCount = files.filter((f) => mediaKind(f) === "audio").length;
  const videoCount = files.filter((f) => mediaKind(f) === "video").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Media Library</h1>
        <p className="text-sm text-white/45 mt-1">{files.length} file{files.length !== 1 ? "s" : ""} stored · {imageCount} image{imageCount !== 1 ? "s" : ""} · {audioCount} audio · {videoCount} video</p>
      </div>

      <UploadZone onUploaded={handleUploaded} />

      <div className="flex flex-wrap items-center gap-2">
        {["all", "images", "audio", "video"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${filter === f ? "bg-a2-green text-black" : "border border-white/15 text-white/55 hover:border-white/30 hover:text-white"}`}
          >
            {f === "all" ? `All (${files.length})` : f === "images" ? `Images (${imageCount})` : f === "audio" ? `Audio (${audioCount})` : `Video (${videoCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/35">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 py-16 text-white/30">
          {filter === "video" ? <Video size={36} className="mb-3" /> : filter === "audio" ? <Music size={36} className="mb-3" /> : <Image size={36} className="mb-3" />}
          <p className="font-semibold">No {filter === "all" ? "files" : filter} uploaded yet</p>
          <p className="text-sm mt-1">Upload files using the area above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((file) => (
            <FileCard key={file.id || file.url || file.stored_name} file={file} onDelete={handleDelete} onPreview={setPreview} />
          ))}
        </div>
      )}
      <MediaPreviewModal file={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
