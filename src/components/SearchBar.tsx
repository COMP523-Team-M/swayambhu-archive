"use client";

import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";

export default function SearchBar({ onSearch }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const performSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search Query from SearchBar:", searchQuery); // Debugging log
    onSearch(searchQuery); // Pass query to parent component
  };

  return (
    <form className="mx-auto mb-4 w-4/5" onSubmit={performSearch}>
      <div className="flex items-center text-gray-400 focus-within:text-gray-600 dark:text-slate-200 dark:focus-within:text-slate-400">
        <FiSearch className="pointer-events-none absolute ml-3 h-5 w-5 transition-all duration-300" />
        <input
          type="text"
          name="search"
          placeholder="Search videos..."
          autoComplete="off"
          value={searchQuery}
          onChange={handleInputChange} // Update search query
          className="w-full rounded-3xl px-3 py-2 pl-10 pr-3 text-black shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
        />
      </div>
    </form>
  );
}
