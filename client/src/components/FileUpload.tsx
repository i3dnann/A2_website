import { FileUp, Loader2, UploadCloud } from "lucide-react";
import type { ChangeEvent, DragEvent } from "react";
import { useRef, useState } from "react";
import BorderBeam from "./magicui/BorderBeam";

type FileUploadProps = {
  label: string;
  accept?: string;
  uploading?: boolean;
  value?: string;
  onFile: (file: File) => void;
};

export default function FileUpload({ label, accept, uploading = false, value, onFile }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label={label}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed p-4 outline-none transition focus-visible:ring-2 focus-visible:ring-[#8a7ac4] ${
        dragging ? "border-[#c7b8ff]/80 bg-[#60519b]/20" : "border-white/15 bg-white/[0.035] hover:border-[#8a7ac4]/55 hover:bg-[#60519b]/10"
      }`}
    >
      {(dragging || uploading) && <BorderBeam duration={3.5} size={110} />}
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100">
        <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#60519b]/25 blur-3xl" />
      </div>
      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/35 text-[#c7b8ff]">
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 truncate text-xs text-white/42">{value ? value : "Drop a file here or click to browse"}</p>
        </div>
        <FileUp size={16} className="ml-auto shrink-0 text-white/35 transition group-hover:text-white/70" />
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onClick={(event) => event.stopPropagation()} onChange={onInput} />
    </div>
  );
}
