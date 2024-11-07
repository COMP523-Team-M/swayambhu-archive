"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './VideoPage.module.css';  // Import the CSS module

interface VideoPageProps {
    params: {
        id: string;
    };
}

const VideoPage: React.FC<VideoPageProps> = ({ params }) => {
    const { id } = params;  // Get the video ID from the URL
    const [videoSrc, setVideoSrc] = useState<string>("https://www.youtube.com/embed/HLn_jmDoOpw?start=0");

    const transcript = [
        { time: "00:00:00", text: "Our job at Learning Center is to work with students to optimize their academic experience whether it be improving their study strategies, working on time management, or figuring out a better system for note-taking. We help students set goals and succeed however they want to succeed as students. One of our top services is academic coaching, and it's designed to help students thrive, not just be successful here but be their best. It allows students to set goals, make action plans, and have a non-judgmental partner to help them follow through and be accountable for those goals." },
        { time: "00:00:31", text: "One of the great things about working with an academic coach is that Carolina students will learn a broad array of learning and study strategies, whether it's reteaching, concept mapping, or even developing your own quiz and study questions. While each of these strategies might not work in every situation, the important thing is becoming much more strategic in approaching classes, tests, and projects. By having this broader range of studying capabilities, students will become even more effective and efficient." },
        { time: "00:01:03", text: "In the Learning Center, we coach students from all different backgrounds and all different years. Our coaching model is a great fit for any kind of student. We work with students who are having a successful academic experience and might want to make some minor changes to their efficiency, for example. We also meet students who are having a difficult time and want regular coaching to learn better strategies, such as improving their biology test scores." },
        { time: "00:01:35", text: "The Learning Center also offers peer tutoring for some of Carolina's most challenging courses. When a student comes to tutoring, they'll be matched with a fellow undergraduate who has recently taken the class and is often recommended by the professor. The tutor is not only able to help as a guide for the subject matter but can also suggest study and test-taking strategies that have helped them succeed in the class. The Learning Center offers specialized STEM support for classes like chemistry, math, and biology." },
        { time: "00:02:02", text: "Our learning specialists in these disciplines can use content from these courses as an on-ramp to develop study strategies or academic skills such as time management or test-taking strategies. Every year, we talk to hundreds of students and ask the question, 'How many of you have one aspect of academic life you'd like to improve?' Everyone always raises their hand. The Learning Center is the place to put those thoughts and intentions into action and start making changes to be your best self as a student." },
        { time: "00:02:33", text: "To schedule an appointment with an academic coach, check the peer tutoring schedule, or learn about upcoming events, visit the Learning Center at UNCG.edu." }
    ];

    // Helper function to convert time string (HH:MM:SS) to seconds
    const convertTimeToSeconds = (time: string) => {
        const parts = time.split(':').map(Number);
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    };

    const handleTranscriptClick = (time: string) => {
        const startInSeconds = convertTimeToSeconds(time);
        setVideoSrc(`https://www.youtube.com/embed/HLn_jmDoOpw?start=${startInSeconds}`);
    };

    return (
        <div className={styles.flex}>
            {/* Left 2/3 section for the video */}
            <div className={styles.leftTwoThirds}>
                <iframe
                    className={styles.videoIframe}
                    src={videoSrc}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube Video"
                ></iframe>
            </div>

            {/* Right 1/3 section */}
            <div className={styles.rightOneThird}>
                <h2 className="text-lg font-semibold mb-4 text-white">Transcript</h2>
                <div className="overflow-y-auto max-h-96 space-y-4">
                    {transcript.map((entry, index) => (
                        <div
                            key={index}
                            className="border-b pb-2 cursor-pointer"
                            onClick={() => handleTranscriptClick(entry.time)}
                        >
                            <p className="text-sm text-blue-400">{entry.time}</p>
                            <p className="text-white">{entry.text}</p>
                        </div>
                    ))}
                </div>

                {/* Return to Main Page Button */}
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
