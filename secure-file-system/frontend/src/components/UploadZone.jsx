import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, FileUp, UploadCloud } from "lucide-react";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i += 1;
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function UploadZone({ selectedFile, uploadProgress, uploadedOk, onSelectFile }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  function pick(file) {
    if (!file) return;
    onSelectFile(file);
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-cyan-900/20 backdrop-blur-xl"
    >
      <h3 className="text-sm font-semibold text-white">Upload Section</h3>
      <p className="mt-1 text-xs text-slate-300">Drag & drop or browse files for secure encryption.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-4 cursor-pointer rounded-2xl border border-dashed p-7 text-center transition ${
          drag ? "border-cyan-300/70 bg-cyan-400/10" : "border-white/20 bg-slate-900/30 hover:bg-slate-900/50"
        }`}
      >
        <UploadCloud size={28} className="mx-auto text-cyan-300" />
        <p className="mt-2 text-sm font-semibold text-white">Drop your file here</p>
        <p className="text-xs text-slate-400">Supported: pdf, png, jpg, docx, xlsx, zip, mp4 and more</p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-purple-900/20"
        >
          Browse File
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {selectedFile ? (
        <div className="mt-4 rounded-xl bg-slate-900/45 p-3 ring-1 ring-white/10">
          <div className="flex items-center gap-2 text-white">
            <FileUp size={15} className="text-cyan-300" />
            <span className="truncate text-sm">{selectedFile.name}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {formatBytes(selectedFile.size)} • {selectedFile.type || "Unknown type"}
          </p>
        </div>
      ) : null}

      <AnimatePresence>
        {uploadProgress > 0 && uploadProgress < 100 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-slate-300">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {uploadedOk ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100 ring-1 ring-emerald-400/30"
          >
            <CheckCircle2 size={16} />
            Upload completed successfully
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

