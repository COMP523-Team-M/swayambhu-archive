"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { FaPlus } from "react-icons/fa6";
import { motion } from "framer-motion";

export default function PlusSign() {
  const router = useRouter();

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="group relative"
    >
      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-100" />
      
      <button
        onClick={() => router.push("/dashboard/upload")}
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/50 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80"
      >
        <FaPlus className="text-sm text-slate-600 transition-colors duration-300 group-hover:text-blue-500 dark:text-slate-400 dark:group-hover:text-blue-400" />
      </button>
    </motion.div>
  );
}