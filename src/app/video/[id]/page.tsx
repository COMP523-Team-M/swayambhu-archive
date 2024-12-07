"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import useReactive from "@/hooks/useReactive";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { FiArrowLeft, FiSearch, FiX, FiClock } from "react-icons/fi";

interface VideoPageProps {
  params: {
    id: string;
  };
}

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

function convertTimeStrWithMilliseconds(timeStr: string) {
  const num = Number(timeStr.replace(/s/g, ""));
  const hours = Math.floor(num / 3600);
  const remainingSeconds = num % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);
  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");
  const secondsStr = seconds.toString().padStart(2, "0");
  return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

const dataHandler = (data: any) => {
  const newData: any[] = [];
  data.englishTranscriptJson.results.forEach((it: any, index: number) => {
    const feature = {
      eText: "",
      aText: "",
      time: "",
      showTime: "",
    };
    feature.eText = it.alternatives[0].transcript;
    const timeStr =
      it.alternatives[0].words[0].startOffset ||
      it.alternatives[0].words[1].startOffset;

    feature.time = timeStr.replace(/s/g, "");
    feature.showTime = convertTimeStrWithMilliseconds(feature.time);
    feature.aText =
      data.transcriptJson.results[index].alternatives[0].transcript;

    newData.push(feature);
  });
  return newData;
};

const TranscriptSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <div 
        key={i} 
        className="relative overflow-hidden rounded-lg bg-white/50 p-4 backdrop-blur-lg transition-all duration-500 dark:bg-slate-800/50"
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="space-y-2">
          <div className="h-4 w-1/6 rounded bg-slate-200/50 dark:bg-slate-700/50" />
          <div className="h-4 w-full rounded bg-slate-200/50 dark:bg-slate-700/50" />
          <div className="h-4 w-5/6 rounded bg-slate-200/50 dark:bg-slate-700/50" />
        </div>
      </div>
    ))}
  </div>
);

const VideoPage: React.FC<VideoPageProps> = ({ params }) => {
  const { id } = params;

  const state: any = useReactive({
    loading: false,
    selectedVideo: null,
    transcript: [],
  });

  const [player, setPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showEnglish, setShowEnglish] = useState<boolean>(true);
  
  const transcriptRefs = useRef<HTMLDivElement[]>([]);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const getList = async () => {
    state.loading = true;
    try {
      const res = await fetch(`/api/elasticsearch/CRUD/get-video?vidID=${id}`);
      const data = await res.json();
      state.selectedVideo = data || null;
      state.transcript = dataHandler(state.selectedVideo);

      const videoUrl = state.selectedVideo?.baseVideoURL;
      const videoId = videoUrl?.includes('watch?v=') 
        ? videoUrl.split('watch?v=')[1]
        : videoUrl?.split('youtu.be/')[1];

      const container = document.getElementById('youtube-player');
      if (container) {
        container.innerHTML = '';
        
        const playerDiv = document.createElement('div');
        playerDiv.id = 'yt-player';
        container.appendChild(playerDiv);

        if (!(window as any).YT) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        (window as any).onYouTubeIframeAPIReady = () => {
          const newPlayer = new (window as any).YT.Player('yt-player', {
            videoId: videoId,
            height: '100%',
            width: '100%',
            playerVars: {
              autoplay: 0,
              modestbranding: 1,
              rel: 0,
              enablejsapi: 1
            },
            events: {
              onReady: (event: any) => {
                setPlayer(event.target);
                state.loading = false;
              },
              onStateChange: (event: any) => {
                console.log('Player state changed:', event.data);
              },
              onError: (error: any) => {
                console.error('YouTube Player Error:', error);
                state.loading = false;
              }
            }
          });
        };
      }

    } catch (error) {
      console.error("Error loading video:", error);
      state.loading = false;
    }
  };

  useEffect(() => {
    getList();
    return () => {
      player?.destroy();
      state.selectedVideo = null;
      document.querySelectorAll(".iframe_api").forEach((el) => el.remove());
      (window as any).onYouTubeIframeAPIReady = null;
      (window as any).YT = null;
    };
  }, []);

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      const time = player.getCurrentTime();
      setCurrentTime(time);
    }, 1000);

    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    if (state.loading) return;

    const activeIdx = state.transcript.findIndex(
      (entry: any, i: number) =>
        entry.time <= currentTime &&
        (i === state.transcript.length - 1 ||
          state.transcript[i + 1].time > currentTime)
    );

    setActiveIndex(activeIdx);

    if (activeIdx >= 0 && transcriptRefs.current[activeIdx]) {
      transcriptRefs.current[activeIdx].scrollIntoView({ 
        behavior: "smooth", 
        block: "nearest" 
      });
    }
  }, [currentTime, state.loading]);

  const handleTranscriptClick = (time: string) => {
    const seconds = Number(time);
    player?.seekTo(seconds, true);
  };

  const performAdvancedSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/elasticsearch/search?query=${encodeURIComponent(query)}&filters[vidID]=${id}`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        
        if (data.metadata.level === 'snippet' && data.results[0].time) {
          handleTranscriptClick(data.results[0].time);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error in advanced search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const jumpToNextMatch = () => {
    if (isAdvancedSearch) {
      performAdvancedSearch(searchTerm);
    } else if (searchTerm.trim() !== "") {
      const filtered = state.transcript.filter(
        (entry: any) =>
          entry.eText.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.aText.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (filtered.length > 0) {
        const nextIndex = currentMatchIndex + 1 < filtered.length ? currentMatchIndex + 1 : 0;
        setCurrentMatchIndex(nextIndex);
        handleTranscriptClick(filtered[nextIndex].time);
      } else {
        setCurrentMatchIndex(-1);
      }
    }
  };

  const handleClearFilter = () => {
    setSearchTerm("");
    setSearchResults([]);
    state.transcript = dataHandler(state.selectedVideo);
    setCurrentMatchIndex(-1);
  };

  return (
    <>
      <ProgressBar />
      <div className="flex min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
        <div className="flex w-full flex-col lg:flex-row">
          <div className="w-full lg:w-8/12">
            <div className="relative aspect-video w-full bg-black">
              <div id="youtube-player" className="h-full w-full" />
            </div>
            {state.selectedVideo && (
              <div className="bg-white/80 p-6 backdrop-blur-xl dark:bg-slate-800/80">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                  {state.selectedVideo.vidTitle}
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  {state.selectedVideo.vidDescription}
                </p>
              </div>
            )}
          </div>

          <div className="w-full lg:w-4/12">
            <div className="h-full bg-white/80 p-6 backdrop-blur-xl dark:bg-slate-800/80">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  Transcript
                </h2>
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-white shadow-lg transition-all duration-300 hover:shadow-xl dark:from-blue-600 dark:to-blue-700"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <FiArrowLeft className="relative transition-transform duration-300 group-hover:-translate-x-1" />
                    <span className="relative">Return</span>
                  </motion.button>
                </Link>
              </div>

              <div className="relative mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder={isAdvancedSearch ? "Try semantic or natural language search..." : "Search transcript..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white/50 px-4 py-2 pl-10 text-slate-800 placeholder-slate-400 backdrop-blur-sm transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:placeholder-slate-500"
                      />
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClearFilter}
                      className="group relative overflow-hidden rounded-lg bg-slate-200 px-4 py-2 text-slate-700 transition-all duration-300 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-400/10 to-slate-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="relative">Clear</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => isAdvancedSearch ? performAdvancedSearch(searchTerm) : jumpToNextMatch()}
                      className="group relative overflow-hidden rounded-lg bg-blue-500 px-4 py-2 text-white transition-all duration-300 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      {isSearching ? (
                        <span className="relative flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Searching...
                        </span>
                      ) : (
                        <span className="relative">Search</span>
                      )}
                    </motion.button>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isAdvancedSearch}
                        onChange={(e) => setIsAdvancedSearch(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-slate-700 dark:peer-focus:ring-blue-800"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Advanced Search
                      </span>
                    </label>

                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={showEnglish}
                        onChange={(e) => setShowEnglish(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-slate-700 dark:peer-focus:ring-blue-800"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {showEnglish ? "English" : "नेपाली"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div
                className="relative h-[calc(100vh-300px)] space-y-4 overflow-y-auto rounded-lg bg-white/50 p-4 backdrop-blur-sm dark:bg-slate-800/50"
                ref={transcriptContainerRef}
                id="wordContainer"
              >
                <AnimatePresence mode="wait">
                  {state.loading ? (
                    <TranscriptSkeleton />
                  ) : (
                    state.transcript.map((entry: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        ref={(el: any) => (transcriptRefs.current[index] = el)}
                        onClick={() => handleTranscriptClick(entry.time)}
                        className={`group cursor-pointer rounded-lg p-4 transition-all duration-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 scroll-mt-4 scroll-mb-4 ${
                          index === activeIndex
                            ? "bg-blue-500/10 dark:bg-blue-500/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 text-sm text-blue-500 dark:text-blue-400">
                          <FiClock className="h-4 w-4" />
                          <span>{entry.showTime}</span>
                        </div>
                        <p className={`mt-2 text-slate-800 dark:text-slate-200 ${
                          index === activeIndex ? "font-medium" : ""
                        }`}>
                          {showEnglish ? entry.eText : entry.aText}
                        </p>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoPage;