/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { VideoData } from "@/app/video/[id]/VideoData";
import useReactive from "@/hooks/useReactive";
import Image from "next/image";

export default function SearchResultPage() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("query");

  const state: any = useReactive({
    searchResults: [],
    loading: false,
  });

  const getList = async () => {
    state.loading = true;
    const res = await fetch(
      `/api/elasticsearch/search/keyword-search?query=${searchTerm}`,
    );
    const data = await res.json();
    console.log(`data ->:`, data);
    state.searchResults = data;
    state.loading = false;
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
        state.searchResults.map(
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
              <div key={vidID} className="mb-6 rounded-lg p-4">
                <Link href={`/video/${vidID}`}>
                  <h2 className="text-xl font-semibold text-blue-600 hover:underline">
                    {vidDescription || `Video ${vidID}`}
                  </h2>
                </Link>
                <div className="mt-2 text-gray-700">
                  <p>Description: {vidDescription}</p>

                  {/* <strong>Matching Transcript Snippets:</strong>
                <ul className="ml-4 list-disc">
                  {(matchingSnippets || []).map(
                    (snippet: any, index: number) => (
                      <li key={index}>
                        <span className="text-sm text-gray-600">
                          [{snippet.time}]
                        </span>{" "}
                        <span
                          className="text-gray-800"
                          dangerouslySetInnerHTML={{ __html: snippet.text }}
                        ></span>
                      </li>
                    ),
                  )}
                </ul> */}
                </div>
              </div>
            </div>
          ),
        )
      ) : (
        <p className="text-center text-gray-500">No results found.</p>
      )}
    </div>
  );
}
