"use client";

import React, { useEffect, useState } from "react";
import { IoSunnyOutline } from "react-icons/io5";
import { BsMoonStars } from "react-icons/bs";
import { RiComputerLine } from "react-icons/ri";
import { useTheme } from "@/context/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeButton() {
  const [showThemes, setShowThemes] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      if (!e.target.closest(".theme-button")) setShowThemes(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="theme-button relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/50 text-xl text-slate-600 shadow-sm backdrop-blur-sm transition-colors duration-300 hover:text-blue-500 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:text-blue-400"
        onClick={() => setShowThemes((prev) => !prev)}
      >
        <IoSunnyOutline />
      </motion.button>

      <AnimatePresence>
        {showThemes && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 overflow-hidden rounded-xl bg-white/80 p-1 shadow-lg backdrop-blur-xl dark:bg-slate-800/80"
          >
            {[
              { id: "light", icon: IoSunnyOutline, label: "Light" },
              { id: "dark", icon: BsMoonStars, label: "Dark" },
              { id: "system", icon: RiComputerLine, label: "System" },
            ].map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTheme(item.id as "light" | "dark" | "system")}
                className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 transition-all duration-300
                  ${theme === item.id 
                    ? "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400" 
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
                  }`}
              >
                <item.icon className="text-lg" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}