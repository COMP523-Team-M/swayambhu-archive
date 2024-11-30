"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { VideoData } from "@/app/video/[id]/VideoData";

export default function SearchResultPage() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("query");
  const lowerCasedSearchTerm = searchTerm?.toLowerCase();

  // Log the search term for debugging
  console.log("Raw Search Term from URL:", searchTerm);
  console.log("Lowercased Search Term:", lowerCasedSearchTerm);

  // Filter videos based on matching transcript entries
  const searchResults = lowerCasedSearchTerm
    ? Object.entries(VideoData)
        .map(([id, video]) => {
          // Check if the video has a transcript and find matches
          const matchingSnippets = video.transcript?.flatMap((entry) => {
            const startIndex = entry.text.toLowerCase().indexOf(lowerCasedSearchTerm);
            if (startIndex !== -1) {
              // Extract a segment of the text containing the search term
              const snippetStart = Math.max(startIndex - 30, 0); // 30 chars before the match
              const snippetEnd = Math.min(startIndex + 30 + searchTerm.length, entry.text.length); // 30 chars after the match
              const snippet = entry.text.slice(snippetStart, snippetEnd).trim();

              // Highlight the search term
              const highlightedSnippet = snippet.replace(
                new RegExp(`(${searchTerm})`, "ig"),
                (match) => `<mark>${match}</mark>`
              );

              return {
                time: entry.time,
                text: highlightedSnippet,
              };
            }
            return [];
          }) || [];

          // If matches exist, include them in the results
          if (matchingSnippets.length > 0) {
            return { id, video, matchingSnippets };
          }
          return null;
        })
        .filter(Boolean) // Remove null results
    : [];

  // Debugging: Log the search results
  console.log("Filtered Search Results:", searchResults);

  return (
    <div className="w-4/5 mx-auto my-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Search Results</h1>

      {searchResults.length > 0 ? (
        searchResults.map(({ id, video, matchingSnippets }) => (
          <div key={id} className="mb-6 p-4 border rounded-lg">
            <Link href={`/video/${id}`}>
              <h2 className="text-xl font-semibold text-blue-600 hover:underline">
                {video.title || `Video ${id}`}
              </h2>
            </Link>
            <div className="mt-2 text-gray-700">
              <strong>Matching Transcript Snippets:</strong>
              <ul className="list-disc ml-4">
                {matchingSnippets.map((snippet, index) => (
                  <li key={index}>
                    <span className="text-sm text-gray-600">[{snippet.time}]</span>{" "}
                    <span
                      className="text-gray-800"
                      dangerouslySetInnerHTML={{ __html: snippet.text }}
                    ></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500">No results found.</p>
      )}

      <Link href="/">
        <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Return to Video Gallery
        </button>
      </Link>
    </div>
  );
}
