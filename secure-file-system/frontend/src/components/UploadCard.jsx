import React, { useCallback, useMemo, useRef, useState } from "react";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function fileTypeLabel(file) {
  if (!file) return "—";
  const ext = file.name?.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "PDF File";
  if (["png", "jpg", "jpeg", "gif"].includes(ext)) return "Image File";
  if (["docx"].includes(ext)) return "Word Document";
  if (["xlsx"].includes(ext)) return "Excel Spreadsheet";
  if (["pptx"].includes(ext)) return "PowerPoint";
  if (["zip", "rar", "7z"].includes(ext)) return "Archive";
  if (["mp3"].includes(ext)) return "Audio File";
  if (["mp4"].includes(ext)) return "Video File";
  if (ext) return `${ext.toUpperCase()} File`;
  return "File";
}

function FileTypeIcon({ file }) {
  const ext = file?.name?.split(".").pop()?.toLowerCase() || "";
  const label =
    ext === "pdf"
      ? "PDF"
      : ["png", "jpg", "jpeg", "gif"].includes(ext)
      ? "IMG"
      : ["docx"].includes(ext)
      ? "DOC"
      : ["xlsx"].includes(ext)
      ? "XLS"
      : ["pptx"].includes(ext)
      ? "PPT"
      : ["zip", "rar", "7z"].includes(ext)
      ? "ZIP"
      : ext
      ? ext.toUpperCase().slice(0, 4)
      : "FILE";

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xs font-extrabold text-white ring-1 ring-white/10">
      {label}
    </div>
  );
}

export default function UploadCard({ onUpload, onSelected }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const fileMeta = useMemo(() => {
    if (!selectedFile) return null;
    return {
      name: selectedFile.name,
      size: selectedFile.size,
      prettySize: formatBytes(selectedFile.size),
      typeLabel: fileTypeLabel(selectedFile),
    };
  }, [selectedFile]);

  const handlePick = useCallback(
    async (file) => {
      if (!file) return;
      setSelectedFile(file);
      onSelected?.(file);
      await onUpload(file);
    },
    [onSelected, onUpload]
  );

  const onDrop = useCallback(
    async (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      await handlePick(file);
    },
    [handlePick]
  );

  return (
    <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
      <div className="text-sm font-semibold text-white">Upload file</div>
      <div className="mt-1 text-xs text-slate-300">
        Drag & drop or choose a file to store temporarily, then encrypt.
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={
          "mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition " +
          (dragOver
            ? "border-cyan-300/60 bg-cyan-300/10"
            : "border-white/15 bg-white/5 hover:bg-white/10")
        }
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-sm font-semibold text-white">Drag & Drop upload box</div>
        <div className="mt-1 text-xs text-slate-300">Max 25MB. Allowed common formats.</div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <div className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
            Browse File
          </div>
          {selectedFile ? (
            <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-200 ring-1 ring-white/10">
              Selected: <span className="font-semibold text-white">{selectedFile.name}</span>
            </div>
          ) : null}
        </div>
      </div>

      {fileMeta ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <FileTypeIcon file={selectedFile} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{fileMeta.name}</div>
            <div className="mt-0.5 text-xs text-slate-300">
              {fileMeta.prettySize} • {fileMeta.typeLabel}
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          await handlePick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

