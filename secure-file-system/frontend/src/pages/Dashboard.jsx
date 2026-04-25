import React, { useEffect, useMemo, useState } from "react";
import UploadCard from "../components/UploadCard.jsx";
import FileTable from "../components/FileTable.jsx";

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
      <div className="text-xs uppercase tracking-wide text-slate-300">{label}</div>
      <div className={"mt-2 text-2xl font-semibold " + (accent || "text-white")}>{value}</div>
    </div>
  );
}

function StepRow({ active, done, text }) {
  const base = "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ring-1 ";
  const style = done
    ? "bg-emerald-500/10 text-emerald-100 ring-emerald-400/15"
    : active
    ? "bg-cyan-400/10 text-cyan-100 ring-cyan-300/20"
    : "bg-white/5 text-slate-300 ring-white/10";
  return (
    <div className={base + style}>
      <div className="h-2 w-2 rounded-full bg-current opacity-80" />
      <div className="min-w-0 truncate">{text}</div>
    </div>
  );
}

export default function Dashboard({ api, onToast }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState(null);
  const [actionState, setActionState] = useState({
    mode: null, // "encrypt" | "decrypt" | null
    running: false,
    step: -1,
    previews: null,
    verified: null,
  });

  const refresh = useMemo(
    () => async () => {
      setLoading(true);
      try {
        const data = await api.request("/api/files");
        setFiles(data.files || []);
      } catch (e) {
        onToast("error", e.message);
      } finally {
        setLoading(false);
      }
    },
    [api, onToast]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleUpload(file) {
    const form = new FormData();
    form.append("file", file);
    try {
      const data = await api.request("/api/upload", { method: "POST", body: form });
      onToast("success", "Uploaded successfully.");
      setSelectedFilename(data?.file?.filename || file?.name || null);
      await refresh();
    } catch (e) {
      onToast("error", e.message);
    }
  }

  async function handleEncrypt(filename) {
    try {
      const data = await api.request(`/api/encrypt/${encodeURIComponent(filename)}`, { method: "POST" });
      setActionState((s) => ({
        ...s,
        previews: data.previews || null,
        verified: null,
      }));
      onToast("success", "Encrypted successfully. Integrity + signature generated.");
      await refresh();
    } catch (e) {
      onToast("error", e.message);
    }
  }

  async function handleDecrypt(filename) {
    try {
      const data = await api.request(`/api/decrypt/${encodeURIComponent(filename)}`, { method: "POST" });
      setActionState((s) => ({
        ...s,
        previews: data.previews || null,
        verified: data.verified || null,
      }));
      onToast("success", "Decrypted successfully. Integrity + signature verified.");
      await refresh();
    } catch (e) {
      onToast("error", e.message);
    }
  }

  function handleDownload(filename, kind) {
    const url = `/api/download/${encodeURIComponent(filename)}?kind=${encodeURIComponent(kind)}`;
    window.location.href = url;
  }

  async function handleDelete(filename) {
    try {
      await api.request(`/api/delete/${encodeURIComponent(filename)}`, { method: "DELETE" });
      onToast("success", "Deleted stored files.");
      await refresh();
    } catch (e) {
      onToast("error", e.message);
    }
  }

  const stats = useMemo(() => {
    const total = files.length;
    const encrypted = files.filter((f) => f.status === "Encrypted").length;
    const decrypted = files.filter((f) => f.status === "Decrypted").length;
    const verified = files.filter((f) => f.integrity_verified && f.signature_verified).length;
    return { total, encrypted, decrypted, verified };
  }, [files]);

  const steps = useMemo(
    () => [
      "Generating AES Key...",
      "Encrypting File...",
      "Encrypting Key with RSA...",
      "Generating Signature...",
      "Done",
    ],
    []
  );

  async function runEncryptWithProgress() {
    if (!selectedFilename || actionState.running) return;
    setActionState({ mode: "encrypt", running: true, step: 0, previews: null, verified: null });
    try {
      for (let i = 0; i < steps.length - 1; i += 1) {
        setActionState((s) => ({ ...s, step: i }));
        // purely UI progress (backend does work in a single request)
        // keep short so it feels responsive
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 220));
      }
      await handleEncrypt(selectedFilename);
      setActionState((s) => ({ ...s, step: steps.length - 1, running: false }));
    } catch {
      setActionState((s) => ({ ...s, running: false }));
    }
  }

  async function runDecryptWithProgress() {
    if (!selectedFilename || actionState.running) return;
    setActionState({ mode: "decrypt", running: true, step: 0, previews: null, verified: null });
    try {
      const decryptSteps = [
        "Loading Encrypted File...",
        "Decrypting AES Key with RSA...",
        "Decrypting File with AES...",
        "Verifying SHA-256 Integrity...",
        "Verifying Digital Signature...",
        "Done",
      ];
      for (let i = 0; i < decryptSteps.length - 1; i += 1) {
        setActionState((s) => ({ ...s, step: i, _labels: decryptSteps }));
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 220));
      }
      await handleDecrypt(selectedFilename);
      setActionState((s) => ({ ...s, step: decryptSteps.length - 1, running: false, _labels: decryptSteps }));
    } catch {
      setActionState((s) => ({ ...s, running: false }));
    }
  }

  return (
    <section className="pt-6">
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-1">
          <UploadCard
            onUpload={handleUpload}
            onSelected={(file) => setSelectedFilename(file?.name || null)}
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatCard label="Total Files Uploaded" value={stats.total} />
            <StatCard label="Encrypted Files" value={stats.encrypted} accent="text-cyan-100" />
            <StatCard label="Decrypted Files" value={stats.decrypted} accent="text-emerald-100" />
            <StatCard label="Verified Files" value={stats.verified} accent="text-violet-100" />
          </div>

          <div className="mt-4 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
            <div className="text-sm font-semibold text-white">Encryption Action Panel</div>
            <div className="mt-1 text-xs text-slate-300">
              {selectedFilename ? (
                <>
                  Selected: <span className="font-semibold text-white">{selectedFilename}</span>
                </>
              ) : (
                "Upload/select a file to enable actions."
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={!selectedFilename || actionState.running}
                onClick={runEncryptWithProgress}
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Encrypt File
              </button>
              <button
                disabled={!selectedFilename || actionState.running}
                onClick={runDecryptWithProgress}
                className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Decrypt File
              </button>
            </div>

            {actionState.mode === "encrypt" ? (
              <div className="mt-4 space-y-2">
                {steps.map((t, idx) => (
                  <StepRow
                    key={t}
                    active={actionState.running && idx === actionState.step}
                    done={!actionState.running && actionState.step >= idx}
                    text={t}
                  />
                ))}
              </div>
            ) : null}

            {actionState.mode === "decrypt" && actionState._labels ? (
              <div className="mt-4 space-y-2">
                {actionState._labels.map((t, idx) => (
                  <StepRow
                    key={t}
                    active={actionState.running && idx === actionState.step}
                    done={!actionState.running && actionState.step >= idx}
                    text={t}
                  />
                ))}
              </div>
            ) : null}

            {actionState.previews ? (
              <div className="mt-4 rounded-2xl bg-black/20 p-4 ring-1 ring-white/10">
                <div className="text-xs font-semibold text-slate-200">
                  Partial values (preview only)
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-300">
                  {actionState.previews.aes_key_hex ? (
                    <div>
                      <span className="text-slate-200">AES Key:</span>{" "}
                      <span className="font-mono text-white">{actionState.previews.aes_key_hex}</span>
                    </div>
                  ) : null}
                  {actionState.previews.rsa_encrypted_aes_key_hex ? (
                    <div>
                      <span className="text-slate-200">RSA Encrypted AES Key:</span>{" "}
                      <span className="font-mono text-white">
                        {actionState.previews.rsa_encrypted_aes_key_hex}
                      </span>
                    </div>
                  ) : null}
                  {actionState.previews.sha256_hex ? (
                    <div>
                      <span className="text-slate-200">SHA-256:</span>{" "}
                      <span className="font-mono text-white">{actionState.previews.sha256_hex}</span>
                    </div>
                  ) : null}
                  {actionState.previews.signature_hex ? (
                    <div>
                      <span className="text-slate-200">Signature:</span>{" "}
                      <span className="font-mono text-white">{actionState.previews.signature_hex}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {actionState.verified ? (
              <div className="mt-3 text-xs text-slate-300">
                Integrity verified:{" "}
                <span className="font-semibold text-emerald-100">
                  {actionState.verified.integrity ? "Yes" : "No"}
                </span>
                {" • "}
                Signature verified:{" "}
                <span className="font-semibold text-emerald-100">
                  {actionState.verified.signature ? "Yes" : "No"}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
            <div className="text-sm font-semibold text-white">Rules</div>
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              <li>- No login required</li>
              <li>- RSA keys auto-generated in backend</li>
              <li>- Plaintext upload is deleted right after encrypt</li>
              <li>- Hash + signature are verified before decrypt</li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-white">Dashboard</div>
              <div className="text-sm text-slate-300">
                Manage uploaded/encrypted/decrypted files stored locally on the server.
              </div>
            </div>
            <button
              onClick={refresh}
              className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/10"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-4 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur">
            <FileTable
              files={files}
              onEncrypt={handleEncrypt}
              onDecrypt={handleDecrypt}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

