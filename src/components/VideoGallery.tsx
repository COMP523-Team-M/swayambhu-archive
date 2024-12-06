/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import SearchBar from "./SearchBar";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    currentPage: 1, // 添加当前页码
    itemsPerPage: 4, // 每页显示数量
    totalPages: 0,
  });

  const getList = async () => {
    state.loading = true;
    const res = await fetch(`/api/elasticsearch/CRUD/get-all-videos`);
    const data = await res.json();
    state.list = data?.results || [];
    state.loading = false;

    state.totalPages = Math.ceil(state.list.length / state.itemsPerPage);
  };

  useEffect(() => {
    getList();
  }, []);

  // 计算总页数

  // 获取当前页的数据
  const getCurrentPageData = () => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.list.slice(startIndex, endIndex);
  };

  // 页码变化处理函数
  const handlePageChange = (pageNumber: number) => {
    state.currentPage = pageNumber;
  };

  if (state.loading) {
    return (
      <div className="mx-10">
        <h1 className="mb-4 text-center text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="mx-10">
      <h1 className="mb-4 text-center text-2xl font-semibold text-slate-700 dark:text-slate-200">
        Video Gallery
      </h1>

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
        {getCurrentPageData().map((video: any) => (
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
            </div>
          </div>
        ))}

        {/* 添加分页控制器 */}
        {state.list.length > 0 && (
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => handlePageChange(state.currentPage - 1)}
              disabled={state.currentPage === 1}
              className={`rounded px-3 py-1 ${
                state.currentPage === 1
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Previous
            </button>

            {/* 页码按钮组 */}
            <div className="flex gap-1">
              {Array.from(
                { length: state.totalPages },
                (_, index) => index + 1,
              ).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`rounded px-3 py-1 ${
                    pageNum === state.currentPage
                      ? "bg-blue-700 text-white"
                      : "bg-gray-200 hover:bg-blue-600 hover:text-white"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(state.currentPage + 1)}
              disabled={state.currentPage === state.totalPages}
              className={`rounded px-3 py-1 ${
                state.currentPage === state.totalPages
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGallery;
