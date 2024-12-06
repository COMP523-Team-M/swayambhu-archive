/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useReactive from "@/hooks/useReactive";
import Image from "next/image";

export default function SearchResultPage() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("query");

  const state: any = useReactive({
    searchResults: [],
    loading: false,
    currentPage: 1,
    itemsPerPage: 4,
    totalPages: 0,
  });

  const getList = async () => {
    state.loading = true;
    const res = await fetch(
      `/api/elasticsearch/search/keyword-search?query=${searchTerm}`,
    );
    const data = await res.json();
    state.searchResults = data;
    state.loading = false;
    
    state.totalPages = Math.ceil(state.searchResults.length / state.itemsPerPage);
  };

  const getCurrentPageData = () => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.searchResults.slice(startIndex, endIndex);
  };

  const handlePageChange = (pageNumber: number) => {
    state.currentPage = pageNumber;
  };

  useEffect(() => {
    getList();
  }, []);

  if (state.loading) {
    return <div className="mx-auto my-10 w-4/5">Loading...</div>;
  }

  return (
    <div className="mx-auto my-10 w-4/5">
      <Link href="/">
        <button className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Return to Video Gallery
        </button>
      </Link>

      <h1 className="mb-6 text-center text-2xl font-bold">Search Results</h1>

      {state.searchResults.length > 0 ? (
        <>
          {getCurrentPageData().map(
            ({ baseVideoURL, vidID, vidDescription }: any) => (
              <div key={vidID} className="mb-6 flex rounded-lg border p-4">
                <div>
                  <Image
                    src={`https://img.youtube.com/vi/${baseVideoURL.split("=")[1]}/0.jpg`}
                    alt="A video"
                    width={240}
                    height={135}
                    className="rounded-lg"
                    priority={false}
                    unoptimized
                  />
                </div>
                <div className="mb-6 rounded-lg p-4">
                  <Link href={`/video/${vidID}`}>
                    <h2 className="text-xl font-semibold text-blue-600 hover:underline">
                      {vidDescription || `Video ${vidID}`}
                    </h2>
                  </Link>
                  <div className="mt-2 text-gray-700">
                    <p>Description: {vidDescription}</p>
                  </div>
                </div>
              </div>
            ),
          )}

          <div className="mt-6 flex items-center justify-center gap-2">
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
        </>
      ) : (
        <p className="text-center text-gray-500">No results found.</p>
      )}
    </div>
  );
}
