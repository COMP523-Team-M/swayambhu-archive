"use client";

import React, { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";

export default function SearchBar({ videoData = [], setFilteredVideos }) { // Add a default value for videoData
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!videoData || videoData.length === 0) return; // Safeguard in case videoData is undefined or empty

    const filtered = videoData.filter((video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVideos(filtered); // Update the filtered videos in VideoGallery
  }, [searchQuery, videoData, setFilteredVideos]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value); // Update the query when typing
  };

  return (
    <>
      <form className="mx-auto w-4/5 mb-4">
        <div className="flex items-center text-gray-400 focus-within:text-gray-600">
          <FiSearch className="pointer-events-none absolute ml-3 h-5 w-5 transition-all duration-300" />
          <input
            type="text"
            name="search"
            placeholder="Search videos..."
            autoComplete="off"
            value={searchQuery}
            onChange={handleSearch} // Handle input changes
            className="w-full rounded-3xl px-3 py-2 pl-10 pr-3 shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </form>
    </>
  );
}
