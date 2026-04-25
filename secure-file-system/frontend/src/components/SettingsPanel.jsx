import React from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPanel({
  autoDeleteTemp,
  onToggleAutoDelete,
  maxUploadSize,
  onChangeMaxUploadSize,
  onExportLogs,
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-xl">
        <h3 className="text-sm font-semibold text-white">Security Preferences</h3>
        <label className="mt-3 flex items-center justify-between text-sm text-slate-200">
          <span>Auto delete temp files</span>
          <input type="checkbox" checked={autoDeleteTemp} onChange={onToggleAutoDelete} className="h-4 w-4 accent-cyan-400" />
        </label>
        <label className="mt-3 block text-sm text-slate-200">
          Max upload size
          <select
            value={maxUploadSize}
            onChange={(e) => onChangeMaxUploadSize(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="10MB">10MB</option>
            <option value="25MB">25MB</option>
            <option value="50MB">50MB</option>
          </select>
        </label>
      </div>

      <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-xl md:col-span-1">
        <h3 className="text-sm font-semibold text-white">Logs</h3>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onExportLogs}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          <Download size={15} />
          Export logs
        </motion.button>
      </div>
    </div>
  );
}

