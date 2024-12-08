"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import SearchInfo from "@/components/SearchInfo";
import Link from "next/link";
import useReactive from "@/hooks/useReactive";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { FiArrowLeft, FiClock, FiSearch } from "react-icons/fi";
// Progress bar component
const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-1 origin-[0%] bg-gradient-to-r from-blue-500 to-purple-500"
      style={{ scaleX }}
    />
  );
};

// Enhanced skeleton loader
const SearchResultSkeleton = () => (
  <div className="space-y-8">
    {[1, 2, 3].map((i) => (
      <div 
        key={i} 
        className="relative overflow-hidden rounded-xl bg-white/50 p-6 backdrop-blur-lg transition-all duration-500 dark:bg-slate-800/50"
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="h-[135px] w-[240px] rounded-lg bg-slate-200/50 dark:bg-slate-700/50" />
          <div className="flex-1 space-y-4">
            <div className="h-6 w-3/4 rounded bg-slate-200/50 dark:bg-slate-700/50" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-slate-200/50 dark:bg-slate-700/50" />
              <div className="h-4 w-5/6 rounded bg-slate-200/50 dark:bg-slate-700/50" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Enhanced card component with magnetic effect
const SearchResultCard = ({ result, index }: { result: any; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isSnippet = result.type === 'snippet';
  const videoId = result.baseVideoURL?.split("=")[1] || result.vidID;
  const timestamp = result.timeSegment ? `&t=${result.timeSegment}s` : '';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100 
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:bg-slate-800/80 dark:shadow-slate-700/20"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] [mask-image:linear-gradient(0deg,white,transparent)]" />
      
      <div className="relative flex flex-col gap-6 md:flex-row">
        <div className="flex-shrink-0 overflow-hidden rounded-lg shadow-md">
          <div className="relative h-[135px] w-[240px]">
            <Image
              src={`https://img.youtube.com/vi/${videoId}/0.jpg`}
              alt="Video thumbnail"
              fill
              className="transform object-cover transition-transform duration-300 group-hover:scale-105"
              priority={false}
              unoptimized
            />
            {isSnippet && result.timeSegment && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
                <FiClock className="h-3 w-3" />
                <span>{Math.floor(result.timeSegment / 60)}:{(result.timeSegment % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-grow space-y-4">
          <Link href={`/video/${result.vidID}`}>
            <h2 className="font-outfit text-xl font-semibold text-slate-800 transition-colors duration-300 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400">
              {isSnippet 
                ? `Relevant Segment from Video ${result.vidTitle}`
                : result.vidTitle || `Video ${result.vidTitle}`
              }
            </h2>
          </Link>

          <div className="text-slate-700 dark:text-slate-300">
            {isSnippet ? (
              <div className="space-y-4">
                {result.transcriptSnippet && (
                  <div className="rounded-lg bg-slate-50/50 p-4 backdrop-blur-sm transition-colors duration-300 hover:bg-slate-100/50 dark:bg-slate-700/50 dark:hover:bg-slate-600/50">
                    <p className="mb-2 font-medium text-slate-600 dark:text-slate-300">Nepali:</p>
                    <p className="text-slate-800 dark:text-slate-200">{result.transcriptSnippet}</p>
                  </div>
                )}
                {result.englishTranslation && 
                 result.englishTranslation !== result.transcriptSnippet && (
                  <div className="rounded-lg bg-slate-50/50 p-4 backdrop-blur-sm transition-colors duration-300 hover:bg-slate-100/50 dark:bg-slate-700/50 dark:hover:bg-slate-600/50">
                    <p className="mb-2 font-medium text-slate-600 dark:text-slate-300">English:</p>
                    <p className="text-slate-800 dark:text-slate-200">{result.englishTranslation}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">{result.vidDescription}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function SearchResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("query");

  const state: any = useReactive({
    searchResults: [],
    metadata: null,
    loading: false,
    currentPage: 1,
    itemsPerPage: 4,
    totalPages: 0,
    searchQuery: searchTerm || "",
  });


  const getList = async () => {
    state.loading = true;
    try {
      const res = await fetch(
        `/api/search-router?query=${searchTerm}&from=${(state.currentPage - 1) * state.itemsPerPage}&size=${state.itemsPerPage}`
      );
      const data = await res.json();
      state.searchResults = data.results;
      state.metadata = data.metadata;
      state.totalPages = Math.ceil(data.metadata.totalResults / state.itemsPerPage);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      state.loading = false;
    }
  };

  const handleSearchClick = () => {
    if (state.searchQuery.trim()) {
      router.push(`/searchResults?query=${encodeURIComponent(state.searchQuery)}`);
    }
  };
  
  const handlePageChange = (pageNumber: number) => {
    state.currentPage = pageNumber;
    getList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    getList();
  }, [searchTerm]);

return (
  <>
    <ProgressBar />
    <div className="container mx-auto my-10 max-w-6xl px-4">
      {/* Search Bar and Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col items-center gap-6"
      >
        <div className="w-full max-w-2xl">
          <SearchBar
            onSearch={(query: string) => {
              state.searchQuery = query; // Update state with the query
            }}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSearchClick} // Trigger search when the button is clicked
          disabled={!state.searchQuery.trim()} // Disable button if query is empty
          className={`group relative flex items-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-medium ${
            state.searchQuery.trim()
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              : "cursor-not-allowed bg-slate-300 text-slate-500"
          }`}
        >
          <FiSearch className="relative text-lg" />
          <span className="relative">View Search Results</span>
        </motion.button>
      </motion.div>

      {/* Search Metadata and Results */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-white shadow-lg transition-all duration-300 hover:shadow-xl dark:from-blue-600 dark:to-blue-700"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <FiArrowLeft className="relative transition-transform duration-300 group-hover:-translate-x-1" />
            <span className="relative">Return to Video Gallery</span>
          </motion.button>
        </Link>

        {state.metadata && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-lg bg-white/80 p-4 shadow-lg backdrop-blur-xl dark:bg-slate-800/80"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
            <div className="relative grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="text-slate-600 dark:text-slate-400">
                Type:{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {state.metadata.searchType}
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Level:{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {state.metadata.level}
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                Results:{" "}
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {state.metadata.totalResults}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {state.loading ? (
          <SearchResultSkeleton />
        ) : state.searchResults.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {state.searchResults.map((result: any, index: number) => (
                <SearchResultCard key={result.vidID} result={result} index={index} />
              ))}
            </motion.div>

            {state.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex items-center justify-center gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(state.currentPage - 1)}
                  disabled={state.currentPage === 1}
                  className={`relative overflow-hidden rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                    state.currentPage === 1
                      ? "cursor-not-allowed bg-slate-300 dark:bg-slate-700"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  Previous
                </motion.button>
                {Array.from({ length: state.totalPages }, (_, index) => index + 1).map(
                  (pageNum) => (
                    <motion.button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative overflow-hidden rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                        pageNum === state.currentPage
                          ? "bg-blue-500 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  )
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePageChange(state.currentPage + 1)}
                  disabled={state.currentPage === state.totalPages}
                  className={`relative overflow-hidden rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                    state.currentPage === state.totalPages
                      ? "cursor-not-allowed bg-slate-300 dark:bg-slate-700"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  }`}
                >
                  Next
                </motion.button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center text-lg text-slate-500 dark:text-slate-400"
          >
            No results found for "{state.searchQuery}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </>
);
}