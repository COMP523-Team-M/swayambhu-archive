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
    const selectedVideo = VideoData[id] || VideoData["1"];
    const [player, setPlayer] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filteredTranscript, setFilteredTranscript] = useState(selectedVideo.transcript);
    const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
    const transcriptRefs = useRef<HTMLDivElement[]>([]);

    const convertTimeToSeconds = (time: string) => {
        const parts = time.split(":").map(Number);
        return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
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
            (entry, i) =>
                convertTimeToSeconds(entry.time) <= currentTime &&
                (i === selectedVideo.transcript.length - 1 ||
                    convertTimeToSeconds(selectedVideo.transcript[i + 1].time) > currentTime)
        );

        setActiveIndex(activeIdx);

        if (activeIdx >= 0 && transcriptRefs.current[activeIdx]) {
            transcriptRefs.current[activeIdx].scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [currentTime]);

    const handleTranscriptClick = (time: string) => {
        const seconds = convertTimeToSeconds(time);
        player.seekTo(seconds, true);
    };

    const jumpToNextMatch = () => {
        if (searchTerm.trim() !== "") {
            const filtered = selectedVideo.transcript.filter((entry) =>
                entry.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredTranscript(filtered);

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
        setFilteredTranscript(selectedVideo.transcript);
        setCurrentMatchIndex(-1);
    };

    return (
        <div className={styles.flex}>
            <div className={styles.leftTwoThirds}>
                <div id="youtube-player" className={styles.videoIframe}></div>
            </div>

            <div className={styles.rightOneThird}>
                <h2 className="text-lg font-semibold mb-4 text-white">Transcript</h2>

                {/* Search bar with Clear Filter and Jump to Next Match buttons */}
                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        placeholder="Search transcript..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded text-black"
                    />
                    <button
                        onClick={handleClearFilter}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Clear Filter
                    </button>
                    <button
                        onClick={jumpToNextMatch}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Jump to Next Match
                    </button>
                </div>

                <div className="overflow-y-auto max-h-96 space-y-4 mt-4">
                    {filteredTranscript.map((entry, index) => (
                        <div
                            key={index}
                            ref={(el) => (transcriptRefs.current[index] = el!)}
                            className={`border-b pb-2 cursor-pointer ${
                                index === activeIndex ? "bg-gray-800" : ""
                            }`}
                            onClick={() => handleTranscriptClick(entry.time)}
                        >
                            <p className="text-sm text-blue-400">{entry.time}</p>
                            <p className="text-white">{entry.text}</p>
                        </div>
                    ))}
                </div>

                <Link href="/">
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Return to Main Page
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default VideoPage;
