import React from "react";
import { Bell, Menu, Search, ShieldCheck } from "lucide-react";

export default function Navbar({
  onMenuToggle,
  search,
  onSearch,
  notifications = 0,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/65 px-4 py-3 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-gradient-to-br from-cyan-500/25 to-purple-500/25 p-2 ring-1 ring-white/15">
            <ShieldCheck size={18} className="text-cyan-200" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Secure File Encryption System</p>
            <p className="text-[11px] text-slate-400">Hybrid cryptography dashboard</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:flex">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search files..."
              className="w-52 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
            />
          </div>

          <button className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200">
            <Bell size={16} />
            {notifications > 0 ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-cyan-400 px-1.5 text-[10px] font-bold text-slate-950">
                {notifications}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}

