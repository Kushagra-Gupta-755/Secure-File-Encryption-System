import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, FileKey2, Home, LayoutDashboard, Settings } from "lucide-react";

const NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "activity", label: "Activity Logs", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

function SideContent({ active, onChange }) {
  return (
    <div className="h-full border-r border-white/10 bg-slate-950/75 p-3 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
        <FileKey2 size={16} className="text-cyan-300" />
        <div>
          <p className="text-xs font-medium text-slate-300">Security Mode</p>
          <p className="text-[11px] text-emerald-300">Active</p>
        </div>
      </div>
      <nav className="space-y-1.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const activeItem = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                activeItem
                  ? "bg-gradient-to-r from-cyan-500/25 to-purple-500/25 text-white ring-1 ring-cyan-300/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default function Sidebar({ active, onChange, mobileOpen, onCloseMobile }) {
  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64">
        <SideContent active={active} onChange={onChange} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
          >
            <motion.div
              className="h-full w-72"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <SideContent active={active} onChange={(id) => { onChange(id); onCloseMobile(); }} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

