import React from "react";

const MAP = {
  verified: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  failed: "bg-red-500/15 text-red-200 ring-red-400/30",
  encrypted: "bg-blue-500/15 text-blue-200 ring-blue-400/30",
  processing: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  neutral: "bg-white/10 text-slate-200 ring-white/15",
};

export default function StatusBadge({ children, tone = "neutral" }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${MAP[tone] || MAP.neutral}`}>
      {children}
    </span>
  );
}

