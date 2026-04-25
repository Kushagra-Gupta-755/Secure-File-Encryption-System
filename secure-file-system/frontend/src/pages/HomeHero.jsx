import React from "react";

export default function HomeHero({ onStart }) {
  return (
    <section className="pt-10">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200 ring-1 ring-white/10">
            Hybrid cryptography • Integrity • Digital signatures
          </div>

          <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
            Secure File Encryption System
          </h1>

          <p className="mt-4 text-slate-300">
            Upload a file, encrypt it using AES-256-CBC, protect the AES key with RSA-2048,
            and verify integrity and authenticity using SHA-256 + RSA signatures. No login.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onStart}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:brightness-110"
            >
              Start Encryption
            </button>
            <div className="text-xs text-slate-400">
              Backend: Flask • Crypto: PyCryptodome • Storage: local filesystem
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur">
          <div className="text-sm font-semibold text-white">Security workflow</div>
          <ol className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <span className="text-slate-200">1.</span> Generate random AES-256 key + IV
            </li>
            <li>
              <span className="text-slate-200">2.</span> AES-CBC encrypt file contents
            </li>
            <li>
              <span className="text-slate-200">3.</span> RSA encrypt AES key with public key
            </li>
            <li>
              <span className="text-slate-200">4.</span> SHA-256 hash encrypted blob
            </li>
            <li>
              <span className="text-slate-200">5.</span> Sign hash using private key (PKCS#1 v1.5)
            </li>
            <li>
              <span className="text-slate-200">6.</span> Verify hash + signature before decrypt
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

