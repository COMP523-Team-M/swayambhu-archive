/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./VideoPage.module.css";
import { VideoData } from "./VideoData"; // Assuming videoData is stored in a separate file

interface VideoPageProps {
  params: {
    id: string;
  };
}

const VideoPage: React.FC<VideoPageProps> = ({ params }) => {
  const { id } = params;
  const selectedVideo: any = VideoData[id] || VideoData["1"];
  const [player, setPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredTranscript, setFilteredTranscript] = useState(
    selectedVideo.transcript,
  );
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const transcriptRefs = useRef<HTMLDivElement[]>([]);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const convertTimeToSeconds = (time: string) => {
    const parts = time.split(":").map(Number);
    return parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1];
  };

  useEffect(() => {
    // Load YouTube API script
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.body.appendChild(script);

    // Initialize YouTube player
    (window as any).onYouTubeIframeAPIReady = () => {
      const ytPlayer = new (window as any).YT.Player("youtube-player", {
        videoId: selectedVideo.videoUrl.split("embed/")[1],
        events: {
          onReady: (event: any) => setPlayer(event.target),
        },
      });
    };

    return () => {
      if (player) player.destroy();
    };
  }, []);

  useEffect(() => {
    if (!player) return;

    // Update current time periodically
    const interval = setInterval(() => {
      const time = player.getCurrentTime();
      setCurrentTime(time);
    }, 1000);

    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    // Find the active transcript index
    const activeIdx = selectedVideo.transcript.findIndex(
      (entry: any, i: number) =>
        convertTimeToSeconds(entry.time) <= currentTime &&
        (i === selectedVideo.transcript.length - 1 ||
          convertTimeToSeconds(selectedVideo.transcript[i + 1].time) >
            currentTime),
    );

    setActiveIndex(activeIdx);

    if (activeIdx >= 0 && transcriptRefs.current[activeIdx]) {
      const wordContainer = document.querySelector(
        "#wordContainer",
      ) as HTMLElement;

      if (wordContainer) {
        wordContainer.scrollTo({
          top: transcriptRefs.current[activeIdx].offsetTop - wordContainer.offsetTop,
          behavior: "smooth",
        });
      }
    }
  }, [currentTime, activeIndex]);

  const handleTranscriptClick = (time: string) => {
    const seconds = convertTimeToSeconds(time);
    player.seekTo(seconds, true);
  };

  const jumpToNextMatch = () => {
    if (searchTerm.trim() !== "") {
      const filtered = selectedVideo.transcript.filter((entry: any) =>
        entry.text.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredTranscript(filtered);

      if (filtered.length > 0) {
        const nextIndex =
          currentMatchIndex + 1 < filtered.length ? currentMatchIndex + 1 : 0;
        setCurrentMatchIndex(nextIndex);
        handleTranscriptClick(filtered[nextIndex].time);
      } else {
        setCurrentMatchIndex(-1);
      }
    }
  };

  const handleClearFilter = () => {
    setSearchTerm("");
    setFilteredTranscript(selectedVideo.transcript);
    setCurrentMatchIndex(-1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftTwoThirds}>
        <div id="youtube-player" className={styles.videoIframe}></div>
      </div>

      <div className={styles.rightOneThird}>
        <h2 className="mb-4 text-lg font-semibold">
          Transcript &nbsp;
          <Link href="/">
            <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Return to Main Page
            </button>
          </Link>
        </h2>

        {/* Search bar with Clear Filter and Jump to Next Match buttons */}
        <div className="mb-1 flex gap-2">
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-gray-300 px-4 py-2 text-black"
          />
          <button
            onClick={handleClearFilter}
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Clear
          </button>
          <button
            onClick={jumpToNextMatch}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Next
          </button>
        </div>

        <div
          className="mt-4 max-h-96 space-y-4 overflow-y-auto"
          ref={transcriptContainerRef}
          id="wordContainer"
        >
          {filteredTranscript.map((entry: any, index: number) => (
            <div
              key={index}
              className={`cursor-pointer border-b pb-2 ${
                index === activeIndex ? "bg-gray-800" : ""
              }`}
              ref={(el: any) => (transcriptRefs.current[index] = el)}
              onClick={() => handleTranscriptClick(entry.time)}
            >
              <p className="text-sm text-blue-400">{entry.time}</p>
              <p className="text-white">{entry.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
