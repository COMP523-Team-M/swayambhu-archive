/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import SearchBar from "./SearchBar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BsPencilFill } from "react-icons/bs";
import { FaTrashAlt } from "react-icons/fa";
import Image from "next/image";
import useReactive from "@/hooks/useReactive";

const VideoGallery: React.FC = () => {
  const router = useRouter(); // Initialize the router for navigation

  const handleButtonClick = () => {
    if (state.searchQuery.trim()) {
      const destination = `/searchResults?query=${encodeURIComponent(
        state.searchQuery,
      )}`;
      console.log("Navigating to:", destination); // Debugging log
      router.push(destination); // Navigate programmatically
    } else {
      console.error("Search query is empty or invalid."); // Log error for empty query
    }
  };

  const state: any = useReactive({
    searchQuery: "",
    list: [],
    loading: false,
  });

  const getList = async () => {
    state.loading = true;
    const res = await fetch(`/api/elasticsearch/CRUD/get-all-videos`);
    const data = await res.json();
    state.list = data?.results || [];
    state.loading = false;
  };

  useEffect(() => {
    getList();
  }, []);

  if (state.loading) {
    return (
      <div className="mx-10">
        <h1 className="mb-4 text-center text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="mx-10">
      <h1 className="mb-4 text-center text-2xl font-bold">Video Gallery</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Search Bar */}
        <SearchBar
          onSearch={(query: string) => {
            state.searchQuery = query;
          }}
        />

        {/* Redirect to Search Results */}
        <button
          onClick={handleButtonClick}
          className={`mt-6 rounded px-4 py-2 ${
            state.searchQuery.trim()
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-400 text-gray-600"
          }`}
          disabled={!state.searchQuery.trim()} // Disable button if query is empty
        >
          View Search Results
        </button>
      </div>

      <br />

      {/* Display Video Gallery */}
      <div className="flex flex-col items-center">
        {state.list.map((video: any) => (
          <div key={video.vidID} className="mb-5 flex border-b-2">
            <div className="mr-5 pb-5">
              <Image
                src={`https://img.youtube.com/vi/${video.baseVideoURL.split("=")[1]}/0.jpg`}
                alt="A video"
                width={240}
                height={135}
                className="rounded-lg"
                priority={false}
                unoptimized
              />
            </div>
            <div className="flex w-80 flex-col">
              <Link
                href={`/video/${video.vidID}`}
                className="cursor-pointer text-xl text-blue-600 hover:underline"
              >
                {video.vidDescription}
              </Link>

              <p>Description: {video.vidDescription}</p>
              <p>More Information: {video.vidMoreInfo}</p>

              {/* <div className="mb-5 mt-auto self-end">
                <BsPencilFill className="mr-2 inline cursor-pointer hover:text-blue-500" />
                <FaTrashAlt className="inline cursor-pointer hover:text-blue-500" />
              </div> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGallery;
