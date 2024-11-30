"use client";

import React, { useState } from "react";
import SearchBar from "./SearchBar";
import { useRouter } from "next/navigation";

const videoData = [
  { id: 1, title: "UNC Computer Science", url: "https://www.youtube.com/embed/HLn_jmDoOpw" },
  { id: 2, title: "Duke Computer Science", url: "https://www.youtube.com/embed/vQsYzrp2tZY" },
  { id: 3, title: "NC State Computer Science", url: "https://www.youtube.com/embed/LRoI-Rw4GBY" },
];

const VideoGallery: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState(""); // Store the search query
  const router = useRouter(); // Initialize the router for navigation

  const handleSearch = (query: string) => {
    console.log("Search Query (From SearchBar):", query); // Debugging log
    setSearchQuery(query); // Update the search query
  };

  const handleButtonClick = () => {
    if (searchQuery.trim()) {
      const destination = `/searchResults?query=${encodeURIComponent(searchQuery)}`;
      console.log("Navigating to:", destination); // Debugging log
      router.push(destination); // Navigate programmatically
    } else {
      console.error("Search query is empty or invalid."); // Log error for empty query
    }
  };

  return (
    <div className="w-4/5 mx-auto my-10">
      <h1 className="text-center text-2xl font-bold mb-4">Video Gallery</h1>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Redirect to Search Results */}
      <button
        onClick={handleButtonClick}
        className={`mt-6 px-4 py-2 rounded ${
          searchQuery.trim()
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-400 text-gray-600 cursor-not-allowed"
        }`}
        disabled={!searchQuery.trim()} // Disable button if query is empty
      >
        View Search Results
      </button>

      {/* Display Video Gallery */}
      <div className="flex flex-wrap justify-around mb-6">
        {videoData.map((video) => (
          <div
            key={video.id}
            className="p-4 border rounded-lg shadow-lg text-center w-60 mb-6"
          >
            <a href={`/video/${video.id}`}>
              <h3 className="text-lg font-semibold text-blue-600 hover:underline mb-2">
                {video.title}
              </h3>
            </a>
            <iframe
              width="240"
              height="135"
              src={video.url}
              frameBorder="0"
              allowFullScreen
              title={video.title}
            ></iframe>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGallery;
