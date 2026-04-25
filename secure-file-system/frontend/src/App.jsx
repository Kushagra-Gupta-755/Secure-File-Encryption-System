import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  CheckCheck,
  FileArchive,
  FileLock2,
  Files,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import FileTable from "./components/FileTable.jsx";
import Loader from "./components/Loader.jsx";
import Navbar from "./components/Navbar.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import Sidebar from "./components/Sidebar.jsx";
import StatsCard from "./components/StatsCard.jsx";
import Toasts from "./components/Toasts.jsx";
import UploadZone from "./components/UploadZone.jsx";
import HomePage from "./pages/HomePage.jsx";

const ENCRYPT_STEPS = [
  "Generating AES Key...",
  "Encrypting File...",
  "Encrypting Key with RSA...",
  "Generating Signature...",
  "Done",
];

const DECRYPT_STEPS = [
  "Loading Encrypted File...",
  "Decrypting AES Key with RSA...",
  "Decrypting File...",
  "Verifying Integrity (SHA256)...",
  "Verifying Signature...",
  "Done",
];

export default function App() {
  const [page, setPage] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedOk, setUploadedOk] = useState(false);
  const [currentFilename, setCurrentFilename] = useState(null);
  const [actionState, setActionState] = useState({
    running: false,
    mode: null, // "encrypt" | "decrypt"
    step: -1,
    previews: null,
    verified: null,
    targetFilename: null,
  });
  const [logs, setLogs] = useState([]);
  const [autoDeleteTemp, setAutoDeleteTemp] = useState(true);
  const [maxUploadSize, setMaxUploadSize] = useState("25MB");

  const api = useMemo(
    () => ({
      async request(path, options) {
        const res = await fetch(path, options);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.success === false) {
          const msg = data?.message || `Request failed (${res.status})`;
          throw new Error(msg);
        }
        return data;
      },
    }),
    []
  );

  function pushToast(type, message) {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }

  useEffect(() => {
    api.request("/api/health").catch((e) => pushToast("error", `Backend not reachable: ${e.message}`));
  }, []);

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    return files.filter((f) => f.filename.toLowerCase().includes(search.toLowerCase()));
  }, [files, search]);

  const stats = useMemo(() => {
    const total = files.length;
    const encrypted = files.filter((f) => f.status === "Encrypted").length;
    const decrypted = files.filter((f) => f.status === "Decrypted").length;
    const verified = files.filter((f) => f.integrity_verified && f.signature_verified).length;
    return { total, encrypted, decrypted, verified };
  }, [files]);

  async function refreshFiles() {
    setLoading(true);
    try {
      const data = await api.request("/api/files");
      setFiles(data.files || []);
    } catch (e) {
      pushToast("error", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshFiles();
  }, []);

  function addLog(type, detail) {
    setLogs((prev) => [{ id: crypto.randomUUID(), time: new Date().toLocaleString(), type, detail }, ...prev].slice(0, 80));
  }

  async function handleUpload(file) {
    setSelectedFile(file);
    setUploadedOk(false);
    setUploadProgress(0);
    const timer = window.setInterval(() => setUploadProgress((p) => Math.min(p + 10, 90)), 110);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await api.request("/api/upload", { method: "POST", body: form });
      setUploadProgress(100);
      setUploadedOk(true);
      setCurrentFilename(data?.file?.filename || file.name);
      addLog("Upload", `Uploaded ${file.name}`);
      pushToast("success", "File uploaded successfully");
      await refreshFiles();
    } catch (e) {
      pushToast("error", e.message);
    } finally {
      window.clearInterval(timer);
      window.setTimeout(() => setUploadProgress(0), 900);
    }
  }

  async function handleEncrypt(filename) {
    try {
      const data = await api.request(`/api/encrypt/${encodeURIComponent(filename)}`, { method: "POST" });
      setActionState((s) => ({ ...s, previews: data.previews || null, verified: null, targetFilename: filename }));
      setCurrentFilename(filename);
      addLog("Encrypt", `Encrypted ${filename}`);
      pushToast("success", "File encrypted successfully");
      await refreshFiles();
    } catch (e) {
      pushToast("error", e.message);
      throw e;
    }
  }

  async function handleDecrypt(filename) {
    try {
      const data = await api.request(`/api/decrypt/${encodeURIComponent(filename)}`, { method: "POST" });
      setActionState((s) => ({
        ...s,
        previews: data.previews || null,
        verified: data.verified || null,
        targetFilename: filename,
      }));
      setCurrentFilename(filename);
      addLog("Decrypt", `Decrypted ${filename}`);
      pushToast("success", "File decrypted successfully");
      await refreshFiles();
    } catch (e) {
      pushToast("error", e.message);
    }
  }

  function handleDownload(filename, kind) {
    addLog("Download", `Downloaded ${kind} file for ${filename}`);
    window.location.href = `/api/download/${encodeURIComponent(filename)}?kind=${encodeURIComponent(kind)}`;
  }

  async function handleDelete(filename) {
    try {
      await api.request(`/api/delete/${encodeURIComponent(filename)}`, { method: "DELETE" });
      addLog("Delete", `Deleted artifacts for ${filename}`);
      pushToast("success", "Stored files deleted");
      await refreshFiles();
    } catch (e) {
      pushToast("error", e.message);
    }
  }

  async function runActionFlow(mode, filename) {
    if (!filename || actionState.running) return;

    const steps = mode === "decrypt" ? DECRYPT_STEPS : ENCRYPT_STEPS;
    setActionState({
      running: true,
      mode,
      step: 0,
      previews: null,
      verified: null,
      targetFilename: filename,
    });

    try {
      for (let i = 0; i < steps.length - 1; i += 1) {
        setActionState((s) => ({ ...s, step: i }));
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 220));
      }

      if (mode === "decrypt") {
        await handleDecrypt(filename);
      } else {
        await handleEncrypt(filename);
      }

      setActionState((s) => ({ ...s, step: steps.length - 1, running: false }));
    } catch {
      setActionState((s) => ({ ...s, running: false }));
    }
  }

  function exportLogs() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "activity-logs.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const notifications = logs.length > 99 ? "99+" : logs.length;

  function cardClass() {
    return "rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl";
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(14,165,233,0.18),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(168,85,247,0.16),transparent_35%),linear-gradient(180deg,#020617,#0b1120)]">
      <Sidebar active={page} onChange={setPage} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="lg:ml-64">
        <Navbar
          onMenuToggle={() => setMobileOpen((v) => !v)}
          search={search}
          onSearch={setSearch}
          notifications={notifications}
        />

        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {page === "home" && <HomePage onStart={() => setPage("dashboard")} />}

              {page === "dashboard" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatsCard title="Total Files" value={stats.total} icon={Files} />
                    <StatsCard title="Encrypted Files" value={stats.encrypted} icon={FileLock2} accent="from-blue-500/20 to-cyan-500/20" />
                    <StatsCard title="Decrypted Files" value={stats.decrypted} icon={ArrowRightLeft} accent="from-violet-500/20 to-blue-500/20" />
                    <StatsCard title="Security Status" value={stats.verified} icon={ShieldCheck} accent="from-emerald-500/20 to-cyan-500/20" />
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    <div className="space-y-4 xl:col-span-1">
                      <UploadZone selectedFile={selectedFile} uploadProgress={uploadProgress} uploadedOk={uploadedOk} onSelectFile={handleUpload} />
                      <div className={cardClass()}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
                          {loading ? <Loader label="Refreshing" /> : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => runActionFlow("encrypt", currentFilename)}
                            disabled={!currentFilename || actionState.running}
                            className="rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
                          >
                            Encrypt File
                          </button>
                          <button
                            onClick={() => runActionFlow("decrypt", currentFilename)}
                            disabled={!currentFilename || actionState.running}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-50"
                          >
                            Decrypt File
                          </button>
                        </div>
                        <div className="mt-3 text-xs text-slate-300">Current file: {currentFilename || "-"}</div>
                      </div>
                    </div>

                    <div className="space-y-4 xl:col-span-2">
                      <div className={cardClass()}>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-white">Recent Uploads</h3>
                          <button onClick={refreshFiles} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 ring-1 ring-white/10">
                            Refresh
                          </button>
                        </div>
                        <FileTable
                          files={filteredFiles}
                          onEncrypt={(filename) => runActionFlow("encrypt", filename)}
                          onDecrypt={(filename) => runActionFlow("decrypt", filename)}
                          onDownload={handleDownload}
                          onDelete={handleDelete}
                        />
                      </div>

                      <div className={cardClass()}>
                        <h3 className="text-sm font-semibold text-white">Encryption Progress Panel</h3>
                        <p className="mt-1 text-xs text-slate-300">
                          {actionState.targetFilename
                            ? `File: ${actionState.targetFilename} • Mode: ${actionState.mode || "idle"}`
                            : "No active operation"}
                        </p>
                        <div className="mt-3 space-y-2">
                          {(actionState.mode === "decrypt" ? DECRYPT_STEPS : ENCRYPT_STEPS).map((step, i) => (
                            <div key={step} className={`rounded-xl px-3 py-2 text-sm ring-1 ${
                              actionState.step > i || (!actionState.running && actionState.step === (actionState.mode === "decrypt" ? DECRYPT_STEPS.length - 1 : ENCRYPT_STEPS.length - 1))
                                ? "bg-emerald-500/10 text-emerald-100 ring-emerald-400/20"
                                : actionState.running && actionState.step === i
                                ? "bg-blue-500/10 text-blue-100 ring-blue-400/20"
                                : "bg-white/5 text-slate-300 ring-white/10"
                            }`}>
                              {step}
                            </div>
                          ))}
                        </div>
                        {actionState.previews ? (
                          <div className="mt-3 rounded-xl bg-slate-900/40 p-3 text-xs text-slate-300 ring-1 ring-white/10">
                            <p className="mb-2 text-slate-100">Partial integrity previews</p>
                            <p>AES Key: <span className="font-mono text-white">{actionState.previews.aes_key_hex || "-"}</span></p>
                            <p>SHA256: <span className="font-mono text-white">{actionState.previews.sha256_hex || "-"}</span></p>
                          </div>
                        ) : null}
                        {actionState.verified ? (
                          <p className="mt-2 text-xs text-emerald-200">
                            Integrity verified: {actionState.verified.integrity ? "Yes" : "No"} • Signature verified: {actionState.verified.signature ? "Yes" : "No"}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className={cardClass()}>
                      <h3 className="text-sm font-semibold text-white">Security Visual</h3>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-200">
                        <span className="rounded-lg bg-white/10 px-2 py-1 ring-1 ring-white/10"><Upload size={12} className="mr-1 inline" /> Upload</span>
                        <Sparkles size={14} className="text-cyan-300" />
                        <span className="rounded-lg bg-blue-500/15 px-2 py-1 ring-1 ring-blue-400/20">AES Encrypt</span>
                        <Sparkles size={14} className="text-purple-300" />
                        <span className="rounded-lg bg-purple-500/15 px-2 py-1 ring-1 ring-purple-400/20">RSA Secure Key</span>
                        <Sparkles size={14} className="text-cyan-300" />
                        <span className="rounded-lg bg-emerald-500/15 px-2 py-1 ring-1 ring-emerald-400/20">SHA256 Verify</span>
                        <Sparkles size={14} className="text-violet-300" />
                        <span className="rounded-lg bg-white/10 px-2 py-1 ring-1 ring-white/10">Stored</span>
                      </div>
                    </div>

                    <div className={cardClass()}>
                      <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
                      <div className="mt-3 max-h-40 space-y-2 overflow-auto pr-1">
                        {logs.length === 0 ? (
                          <p className="text-sm text-slate-300">No activity yet.</p>
                        ) : logs.slice(0, 8).map((l) => (
                          <div key={l.id} className="rounded-lg bg-white/5 px-3 py-2 text-xs ring-1 ring-white/10">
                            <p className="text-slate-100">{l.type}</p>
                            <p className="text-slate-400">{l.detail}</p>
                            <p className="text-[11px] text-slate-500">{l.time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {page === "activity" && (
                <div className={cardClass()}>
                  <h2 className="text-sm font-semibold text-white">Activity Logs</h2>
                  <div className="mt-4 max-h-[65vh] space-y-2 overflow-auto pr-1">
                    {logs.length === 0 ? <p className="text-sm text-slate-300">No logs yet.</p> : logs.map((l) => (
                      <div key={l.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10">
                        <p className="font-medium text-white">{l.type}</p>
                        <p className="text-slate-300">{l.detail}</p>
                        <p className="text-xs text-slate-500">{l.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {page === "settings" && (
                <SettingsPanel
                  autoDeleteTemp={autoDeleteTemp}
                  onToggleAutoDelete={() => setAutoDeleteTemp((v) => !v)}
                  maxUploadSize={maxUploadSize}
                  onChangeMaxUploadSize={setMaxUploadSize}
                  onExportLogs={exportLogs}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Toasts items={toasts} />
    </div>
  );
}

