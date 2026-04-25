import React from "react";
import { AnimatePresence, motion } from "framer-motion";

function Toast({ type, message }) {
  const styles =
    type === "success"
      ? "bg-emerald-500/15 ring-1 ring-emerald-400/20 text-emerald-100"
      : type === "error"
      ? "bg-red-500/15 ring-1 ring-red-400/20 text-red-100"
      : "bg-white/10 ring-1 ring-white/10 text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4 }}
      className={"rounded-2xl px-4 py-3 text-sm shadow-lg backdrop-blur " + styles}
    >
      {message}
    </motion.div>
  );
}

export default function Toasts({ items }) {
  if (!items?.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-32px))] flex-col gap-2">
      <AnimatePresence>
        {items.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} />
        ))}
      </AnimatePresence>
    </div>
  );
}

