"use client";  // Ensure this line is at the top

import React, { useState } from 'react';
import PageButton from './PageButton';
import SearchBar from './SearchBar';
import Link from 'next/link';

// Define the type for video data
interface VideoData {
    id: number;
    title: string;
    url: string;
}

// Example video data array
const videoData: VideoData[] = [
    { id: 1, title: 'Video 1', url: 'https://www.example.com/video1' },
    { id: 2, title: 'Video 2', url: 'https://www.example.com/video2' },
    { id: 3, title: 'Video 3', url: 'https://www.example.com/video3' },
    { id: 4, title: 'Video 4', url: 'https://www.example.com/video4' },
    { id: 5, title: 'Video 5', url: 'https://www.example.com/video5' },
    { id: 6, title: 'Video 6', url: 'https://www.example.com/video6' },
    { id: 7, title: 'Video 7', url: 'https://www.example.com/video7' },
    { id: 8, title: 'Video 8', url: 'https://www.example.com/video8' },
    { id: 9, title: 'Video 9', url: 'https://www.example.com/video9' },
    { id: 10, title: 'Video 10', url: 'https://www.example.com/video10' },
    { id: 11, title: 'Video 11', url: 'https://www.example.com/video11' },
    { id: 12, title: 'Video 12', url: 'https://www.example.com/video12' }
];

// Number of videos to display per page
const videosPerPage = 4;

const VideoGallery: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [filteredVideos, setFilteredVideos] = useState<VideoData[]>(videoData);

    const indexOfLastVideo = currentPage * videosPerPage;
    const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
    const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);

    return (
        <div>
            <h1 className="text-center text-2xl font-bold mb-4">Video Gallery</h1>
            <SearchBar videoData={videoData} setFilteredVideos={setFilteredVideos} />

            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', marginBottom: '20px' }}>
                {currentVideos.map((video) => (
                    <div key={video.id} style={{ margin: '10px', textAlign: 'center', width: '250px' }}>
                        <Link href={`/video/${video.id}`}>
                            <h3 className="mb-2 cursor-pointer text-blue-600 hover:underline">{video.title}</h3>
                        </Link>
                        <iframe
                            width="250"
                            height="140"
                            src={video.url}
                            frameBorder="0"
                            allowFullScreen
                            title={video.title}
                        ></iframe>
                    </div>
                ))}
            </div>

            {filteredVideos.length > 0 ? (
                <PageButton
                    howMany={videosPerPage}
                    total={filteredVideos.length}
                    curPage={currentPage}
                    setCurrentPage={setCurrentPage}
                />
            ) : (
                <p className="text-center text-gray-500 mt-4">No videos found.</p>
            )}
        </div>
    );
};

export default VideoGallery;
