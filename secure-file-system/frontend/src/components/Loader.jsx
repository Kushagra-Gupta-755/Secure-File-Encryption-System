import React from "react";
import { motion } from "framer-motion";

export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-300">
      <motion.span
        className="h-4 w-4 rounded-full border-2 border-cyan-300/40 border-t-cyan-300"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      />
      <span>{label}</span>
    </div>
  );
}

