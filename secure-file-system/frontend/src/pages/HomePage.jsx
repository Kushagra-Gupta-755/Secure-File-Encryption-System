import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

export default function HomePage({ onStart }) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-100 ring-1 ring-cyan-300/20">
          <Sparkles size={14} />
          Hybrid Cryptography Platform
        </div>

        <h1 className="mt-5 text-3xl font-bold leading-tight text-white md:text-4xl">
          Secure File Encryption System
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Encrypt, decrypt and verify files using AES-256 + RSA-2048 + SHA-256 with digital
          signatures in a modern security dashboard.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-purple-900/20"
          >
            Start in Dashboard
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl"
      >
        <h2 className="text-lg font-semibold text-white">Security Flow</h2>
        <div className="mt-5 space-y-3">
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <p className="text-sm font-medium text-white">1. Upload</p>
            <p className="text-xs text-slate-300">Drag and drop files securely.</p>
          </div>
          <div className="rounded-xl bg-blue-500/10 p-3 ring-1 ring-blue-400/20">
            <p className="text-sm font-medium text-blue-100">2. AES Encryption</p>
            <p className="text-xs text-blue-100/80">AES-256 with random IV protects file content.</p>
          </div>
          <div className="rounded-xl bg-purple-500/10 p-3 ring-1 ring-purple-400/20">
            <p className="text-sm font-medium text-purple-100">3. RSA Key Protection</p>
            <p className="text-xs text-purple-100/80">AES key encrypted by RSA public key.</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-400/20">
            <p className="text-sm font-medium text-emerald-100">4. Integrity & Signature Verification</p>
            <p className="text-xs text-emerald-100/80">SHA-256 hash and RSA signature verification.</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
            <LockKeyhole size={15} className="text-cyan-200" />
            <span className="text-xs text-slate-200">AES + RSA</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
            <ShieldCheck size={15} className="text-emerald-200" />
            <span className="text-xs text-slate-200">Integrity Verified</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

