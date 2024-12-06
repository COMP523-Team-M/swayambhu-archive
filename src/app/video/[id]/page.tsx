/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./VideoPage.module.css";
import { VideoData } from "./VideoData"; // Assuming videoData is stored in a separate file
import useReactive from "@/hooks/useReactive";

interface VideoPageProps {
  params: {
    id: string;
  };
}

function convertTimeStrWithMilliseconds(timeStr: string) {
  // 提取出数字部分（去除单位's'）
  const num = Number(timeStr.replace(/s/g, ""));
  // 计算小时、分钟、秒、毫秒
  const hours = Math.floor(num / 3600);
  const remainingSeconds = num % 3600;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);
  // const milliseconds = Math.round((remainingSeconds % 1) * 1000);
  // 将计算出的时间部分格式化为两位数（小时、分钟、秒）或三位数（毫秒）的字符串，不足位的在前面补0
  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");
  const secondsStr = seconds.toString().padStart(2, "0");
  // const millisecondsStr = milliseconds.toString().padStart(3, "0");
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

    // 转换为 00：00：00 格式
    feature.showTime = convertTimeStrWithMilliseconds(feature.time);

    feature.aText =
      data.transcriptJson.results[index].alternatives[0].transcript;

    newData.push(feature);
  });
  console.log(`newData ->:`, newData);

  return newData;
};

const initPt = () => {
  // Load YouTube API script
  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  // script.async = true;
  document.body.appendChild(script);
};

function onYouTubeIframeAPIReady(videoId: any, onPlayerReady: any) {
  new (window as any).YT.Player("youtube-player", {
    videoId,
    events: {
      onReady: onPlayerReady,
    },
  });
}

const VideoPage: React.FC<VideoPageProps> = ({ params }) => {
  const { id } = params;

  const state: any = useReactive({
    loading: false,
    selectedVideo: null,

    transcript: [],
  });

  const getList = async () => {
    const res = await fetch(`/api/elasticsearch/CRUD/get-video?vidID=${id}`);
    const data = await res.json();
    state.selectedVideo = data || {};
    state.transcript = dataHandler(state.selectedVideo);
    state.loading = true;

    const videoId = state.selectedVideo?.baseVideoURL.split("=")[1];
    console.log(`videoId ->:`, videoId);

    // Initialize YouTube player
    // (window as any).onYouTubeIframeAPIReady = () => {
    //   new (window as any).YT.Player("youtube-player", {
    //     videoId,
    //     events: {
    //       onReady: (event: any) => setPlayer(event.target),
    //     },
    //   });
    // };

    onYouTubeIframeAPIReady(videoId, (event: any) => {
      setPlayer(event.target);
    });
  };

  useEffect(() => {
    initPt();
    getList();

    return () => {
      if (player) player.destroy();
    };
  }, []);

  const [player, setPlayer] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState<string>("");

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
    if (!player) return;
    if (!state.loading) return;

    // Update current time periodically
    const interval = setInterval(() => {
      const time = player.getCurrentTime();
      setCurrentTime(time);
    }, 1000);

    return () => clearInterval(interval);
  }, [player, state.loading]);

  useEffect(() => {
    if (!state.loading) return;

    // Find the active transcript index
    const activeIdx = state.transcript.findIndex(
      (entry: any, i: number) =>
        entry.time <= currentTime &&
        (i === state.transcript.length - 1 ||
          state.transcript[i + 1].time > currentTime),
    );

    setActiveIndex(activeIdx);

    if (activeIdx >= 0 && transcriptRefs.current[activeIdx]) {
      const wordContainer = document.querySelector(
        "#wordContainer",
      ) as HTMLElement;

      if (wordContainer) {
        wordContainer.scrollTo({
          top:
            transcriptRefs.current[activeIdx].offsetTop -
            wordContainer.offsetTop,
          behavior: "smooth",
        });
      }
    }
  }, [currentTime, activeIndex, state.loading]);

  const handleTranscriptClick = (time: string) => {
    // const seconds = convertTimeToSeconds(time);
    const seconds = Number(time);
    console.log(`seconds ->:`, seconds);
    player?.seekTo(seconds, true);
  };

  const jumpToNextMatch = () => {
    if (searchTerm.trim() !== "") {
      const filtered = state.transcript.filter(
        (entry: any) =>
          entry.eText.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.aText.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      state.transcript = filtered;

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
    state.transcript = dataHandler(state.selectedVideo);
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
          {state.transcript.map((entry: any, index: number) => (
            <div
              key={index}
              className={`cursor-pointer border-b pb-2 ${
                index === activeIndex ? "bg-gray-800" : ""
              }`}
              ref={(el: any) => (transcriptRefs.current[index] = el)}
              onClick={() => handleTranscriptClick(entry.time)}
            >
              <p className="text-sm text-blue-400">{entry.showTime}</p>
              <p className={`${index === activeIndex ? "text-white" : ""}`}>
                {entry.eText}
              </p>
              <p className={`${index === activeIndex ? "text-white" : ""}`}>
                {entry.aText}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
