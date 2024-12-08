"use client";

import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { motion } from "framer-motion";

export default function SearchBar({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const performSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <motion.form
      className="relative mx-auto mb-4 w-4/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={performSearch}
    >
      <div className="group relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

        <div
          className={`relative flex items-center overflow-hidden rounded-2xl bg-white/80 shadow-lg backdrop-blur-xl transition-all duration-300 dark:bg-slate-800/80 ${
            isFocused
              ? "ring-2 ring-blue-500/50 dark:ring-blue-400/50"
              : "ring-1 ring-slate-200/50 dark:ring-slate-700/50"
          }`}
        >
          <motion.div
            animate={{
              x: isFocused ? 5 : 0,
              scale: isFocused ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute ml-4"
          >
            <FiSearch
              className={`h-5 w-5 transition-colors duration-300 ${
                isFocused
                  ? "text-blue-500 dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            />
          </motion.div>

          <input
            type="text"
            name="search"
            placeholder="Search videos..."
            autoComplete="off"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent px-6 py-3 pl-12 text-base text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 dark:text-white dark:placeholder-slate-500"
          />
        </div>
      </div>

      {searchQuery && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-0 text-sm text-slate-500 dark:text-slate-400"
        >
          Press Enter to search
        </motion.div>
      )}
    </motion.form>
  );
}
