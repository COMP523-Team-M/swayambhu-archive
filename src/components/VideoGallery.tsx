"use client";

import React, { useState } from "react";
import SearchBar from "./SearchBar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BsPencilFill } from "react-icons/bs";
import { FaTrashAlt } from "react-icons/fa";
import Image from "next/image";

const videoData = [
  {
    id: 1,
    title: "UNC Computer Science",
    url: "https://www.youtube.com/embed/HLn_jmDoOpw",
  },
  {
    id: 2,
    title: "Duke Computer Science",
    url: "https://www.youtube.com/embed/vQsYzrp2tZY",
  },
  {
    id: 3,
    title: "NC State Computer Science",
    url: "https://www.youtube.com/embed/LRoI-Rw4GBY",
  },
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
    <div className="mx-10">
      <h1 className="mb-4 text-center text-2xl font-semibold">Video Gallery</h1>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Redirect to Search Results */}
      <button
        onClick={handleButtonClick}
        className={`mt-6 rounded px-4 py-2 ${
          searchQuery.trim()
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "cursor-not-allowed bg-gray-400 text-gray-600"
        }`}
        disabled={!searchQuery.trim()} // Disable button if query is empty
      >
        View Search Results
      </button>

      {/* Display Video Gallery */}
      <div className="flex flex-col items-center">
        {videoData.map((video) => (
          <div key={video.id} className="mb-5 flex border-b-2 last:border-b-0">
            <div className="mr-5 pb-5">
              <Image
                src={`https://img.youtube.com/vi/${video.url.split("embed/")[1]}/0.jpg`}
                alt={"A video"}
                width={240}
                height={135}
                className="rounded-lg"
              ></Image>
              {/* <iframe
                width="240"
                height="135"
                src={video.url}
                frameBorder="0"
                allowFullScreen
                title={video.title}
              ></iframe> */}
            </div>
            <div className="flex w-80 flex-col">
              <Link
                href={`/video/${video.id}`}
                className="cursor-pointer text-xl text-sky-500 hover:underline"
              >
                {video.title}
              </Link>
              <p className="text-slate-700">Description</p>
              <p className="text-slate-700">More Information</p>
              <div className="mb-5 mt-auto self-end">
                <BsPencilFill className="mr-2 inline cursor-pointer hover:text-blue-500"></BsPencilFill>
                <FaTrashAlt className="inline cursor-pointer hover:text-blue-500"></FaTrashAlt>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGallery;
