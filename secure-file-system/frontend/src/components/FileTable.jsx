import React from "react";
import { motion } from "framer-motion";
import { Download, KeyRound, Lock, Trash2, Unlock } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

function ActionButton({ title, onClick, disabled, color = "default", icon: Icon }) {
  const palette =
    color === "danger"
      ? "bg-red-500/12 text-red-200 ring-red-400/20 hover:bg-red-500/25"
      : "bg-white/5 text-slate-100 ring-white/15 hover:bg-white/10";
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs ring-1 transition ${palette} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <Icon size={14} />
      {title}
    </motion.button>
  );
}

export default function FileTable({ files, onEncrypt, onDecrypt, onDownload, onDelete, compact = false }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
          <tr>
            <th className="px-3 py-3">File Name</th>
            <th className="px-3 py-3">Size</th>
            <th className="px-3 py-3">Upload Date</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Integrity</th>
            {!compact ? <th className="px-3 py-3">Signature</th> : null}
            <th className="px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {files.length === 0 ? (
            <tr>
              <td className="px-3 py-5 text-slate-300" colSpan={compact ? 6 : 7}>
                No files yet. Upload one to get started.
              </td>
            </tr>
          ) : (
            files.map((f) => {
              const canEncrypt = f.status === "Uploaded";
              const canDecrypt = f.encrypted_artifacts === true;
              const canDownloadEnc = f.encrypted_artifacts === true;
              const canDownloadDec = f.decrypted_ready === true;

              return (
                <tr key={f.filename} className="text-slate-200">
                  <td className="px-3 py-3 font-medium text-white">{f.filename}</td>
                  <td className="px-3 py-3 text-slate-300">{formatBytes(f.size)}</td>
                  <td className="px-3 py-3 text-slate-300">{formatDate(f.uploaded_at)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={f.status === "Encrypted" ? "encrypted" : f.status === "Decrypted" ? "verified" : "processing"}>{f.status || "Processing"}</StatusBadge>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge tone={f.integrity_verified ? "verified" : "failed"}>
                      {f.integrity_verified ? "Verified" : "Failed"}
                    </StatusBadge>
                  </td>
                  {!compact ? (
                    <td className="px-3 py-3">
                      <StatusBadge tone={f.signature_verified ? "verified" : "failed"}>
                        {f.signature_verified ? "Valid" : "Failed"}
                      </StatusBadge>
                    </td>
                  ) : null}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton title="Encrypt" icon={Lock} disabled={!canEncrypt} onClick={() => onEncrypt(f.filename)} />
                      <ActionButton title="Decrypt" icon={Unlock} disabled={!canDecrypt} onClick={() => onDecrypt(f.filename)} />
                      <ActionButton title=".enc" icon={KeyRound} disabled={!canDownloadEnc} onClick={() => onDownload(f.filename, "encrypted")} />
                      <ActionButton title="Download" icon={Download} disabled={!canDownloadDec} onClick={() => onDownload(f.filename, "decrypted")} />
                      <ActionButton title="Delete" icon={Trash2} color="danger" onClick={() => onDelete(f.filename)} />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}



