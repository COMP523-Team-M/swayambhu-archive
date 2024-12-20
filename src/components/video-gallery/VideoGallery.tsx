/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import SearchBar from "../SearchBar";
import { useRouter } from "next/navigation";
import useReactive from "@/hooks/useReactive";
import SearchInfo from "./SearchInfo";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { FiSearch } from "react-icons/fi";
import { VideoCard } from "./VideoCard";

const ProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-1 origin-[0%] bg-gradient-to-r from-blue-500 to-purple-500"
      style={{ scaleX }}
    />
  );
};

const GallerySkeleton = () => (
  <div className="space-y-8">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="relative overflow-hidden rounded-xl bg-white/50 p-6 backdrop-blur-lg transition-all duration-500 dark:bg-slate-800/50"
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex gap-5">
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

const VideoGallery: React.FC = () => {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  const state: any = useReactive({
    searchQuery: "",
    list: [],
    loading: true,
    currentPage: 1,
    itemsPerPage: 4,
    totalPages: 0,
  });

  const handleButtonClick = () => {
    if (state.searchQuery.trim()) {
      const destination = `/searchResults?query=${encodeURIComponent(
        state.searchQuery,
      )}`;
      router.push(destination);
    }
  };

  const getList = async () => {
    if (!isInitialized) {
      try {
        const res = await fetch(`/api/elasticsearch/CRUD/get-all-videos`);
        const data = await res.json();
        state.list = data?.results || [];
        state.totalPages = Math.ceil(state.list.length / state.itemsPerPage);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        state.loading = false;
        setIsInitialized(true);
      }
    }
  };

  useEffect(() => {
    getList();
  }, [isInitialized]);

  const getCurrentPageData = () => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return state.list.slice(startIndex, endIndex);
  };

  const handlePageChange = (pageNumber: number) => {
    state.currentPage = pageNumber;
    // window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <ProgressBar />
      <div className="container mx-auto max-w-6xl px-4 py-10">
        {/* <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center text-3xl font-semibold text-slate-800 dark:text-slate-200"
        >
          Video Gallery
        </motion.h1> */}

        <SearchInfo />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12 flex flex-col items-center gap-6"
        >
          <div className="w-full max-w-2xl">
            <SearchBar
              onSearch={(query: string) => {
                state.searchQuery = query;
              }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleButtonClick}
            disabled={!state.searchQuery.trim()}
            className={`group relative flex items-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-medium transition-all duration-300 ${
              state.searchQuery.trim()
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl dark:from-blue-600 dark:to-blue-700"
                : "cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <FiSearch className="relative text-lg" />
            <span className="relative">View Search Results</span>
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          {state.loading ? (
            <GallerySkeleton />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {getCurrentPageData().map((video: any) => (
                <VideoCard
                  key={video.vidID}
                  video={video}
                  setIsInitialized={setIsInitialized}
                />
              ))}

              {state.list.length > 0 && (
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
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                    <span className="relative">Previous</span>
                  </motion.button>

                  <div className="flex gap-2">
                    {Array.from(
                      { length: state.totalPages },
                      (_, index) => index + 1,
                    ).map((pageNum) => (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative overflow-hidden rounded-lg px-4 py-2 font-medium transition-all duration-300 ${
                          pageNum === state.currentPage
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 dark:bg-blue-600"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                        <span className="relative">{pageNum}</span>
                      </motion.button>
                    ))}
                  </div>

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
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                    <span className="relative">Next</span>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default VideoGallery;
