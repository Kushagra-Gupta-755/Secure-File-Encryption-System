import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, accent = "from-cyan-500/20 to-purple-500/20" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame;
    const duration = 700;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-300">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{count}</p>
        </div>
        <div className={`rounded-xl bg-gradient-to-br p-2.5 ${accent} ring-1 ring-white/20`}>
          <Icon size={18} className="text-cyan-100" />
        </div>
      </div>
    </motion.div>
  );
}

