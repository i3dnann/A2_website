import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Trash2, Copy, Check, Image, File, X, Loader2 } from "lucide-react";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/avif"];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileUrl(blobKey) {
  return `/api/media/file?key=${encodeURIComponent(blobKey)}`;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="rounded p-1 text-white/45 hover:text-white transition" title="Copy URL">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

function FileCard({ file, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const isImage = IMAGE_TYPES.includes(file.mime_type);
  const url = fileUrl(file.blob_key);

  const handleDelete = async () => {
    if (!confirm(`Delete "${file.original_name}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: file.id }),
      });
      if (res.ok) onDelete(file.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative rounded-xl border border-white/10 bg-white/4 overflow-hidden hover:border-white/20 transition">
      <div className="aspect-square w-full bg-white/5 flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img src={url} alt={file.original_name} className="w-full h-full object-cover" />
        ) : (
          <File size={40} className="text-white/25" />
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs font-semibold truncate text-white/80" title={file.original_name}>{file.original_name}</p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="text-xs text-white/35">{formatBytes(file.size)}</span>
          <div className="flex items-center gap-0.5">
            <CopyButton text={window.location.origin + url} />
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded p-1 text-white/45 hover:text-red-400 transition disabled:opacity-40"
              title="Delete"
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
    const files = Array.from(fileList);
    if (!files.length) return;

    setUploading(true);
    setProgress(files.map((f) => ({ name: f.name, status: "pending" })));

    const results = [];
    for (let i = 0; i < files.length; i++) {
      setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: "uploading" } : p));
      const formData = new FormData();
      formData.append("file", files[i]);
      try {
        const res = await fetch("/api/media/upload", { method: "POST", body: formData });
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
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${dragging ? "border-a2-green bg-a2-green/10" : "border-white/15 hover:border-white/30 hover:bg-white/3"}`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
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
              <p className="text-sm mt-0.5">Images, documents, and any other files</p>
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

  useEffect(() => {
    fetch("/api/media/list")
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

  const filtered = filter === "images"
    ? files.filter((f) => IMAGE_TYPES.includes(f.mime_type))
    : files;

  const imageCount = files.filter((f) => IMAGE_TYPES.includes(f.mime_type)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Media Library</h1>
        <p className="text-sm text-white/45 mt-1">{files.length} file{files.length !== 1 ? "s" : ""} stored · {imageCount} image{imageCount !== 1 ? "s" : ""}</p>
      </div>

      <UploadZone onUploaded={handleUploaded} />

      <div className="flex items-center gap-2">
        {["all", "images"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${filter === f ? "bg-a2-green text-black" : "border border-white/15 text-white/55 hover:border-white/30 hover:text-white"}`}
          >
            {f === "all" ? `All (${files.length})` : `Images (${imageCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/35">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 py-16 text-white/30">
          <Image size={36} className="mb-3" />
          <p className="font-semibold">{filter === "images" ? "No images uploaded yet" : "No files uploaded yet"}</p>
          <p className="text-sm mt-1">Upload files using the area above</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((file) => (
            <FileCard key={file.id} file={file} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
