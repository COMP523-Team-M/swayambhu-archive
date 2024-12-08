/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import GalleryIcons from "./GalleryIcons";

export const VideoCard = ({
  video,
  setIsInitialized,
}: {
  video: any;
  setIsInitialized: Dispatch<SetStateAction<boolean>>;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const [deleting, setDeleting] = useState(false);
  const [alert, setShowAlert] = useState(false);

  // const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  //   if (!cardRef.current) return;
  //   const card = cardRef.current;
  //   const rect = card.getBoundingClientRect();
  //   const x = e.clientX - rect.left;
  //   const y = e.clientY - rect.top;

  //   const centerX = rect.width / 2;
  //   const centerY = rect.height / 2;
  //   const rotateX = (y - centerY) / 20;
  //   const rotateY = (centerX - x) / 20;

  //   card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  // };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  const handleDelete = () => {
    if (alert) return;

    setDeleting(true);
    setShowAlert(true);

    fetch(`/api/elasticsearch/CRUD/delete-video?vidID=${video.vidID}`, {
      method: "DELETE",
      body: video.vidID,
    }).then(() => {
      setDeleting(false);
      setTimeout(() => setShowAlert(false), 2000);
      setIsInitialized(false);
    });

    // new Promise((resolve) => setTimeout(() => resolve("yet"), 3000)).then(
    //   () => {
    //     setDeleting(false);
    //     setTimeout(() => setShowAlert(false), 2000);
    //     setIsInitialized(false);
    //   },
    // );
  };

  return (
    <motion.div
      ref={cardRef}
      // initial={{ opacity: 0, y: 50 }}
      // animate={{ opacity: 1, y: 0 }}
      // exit={{ opacity: 0, y: -50 }}
      // transition={{
      //   duration: 0.5,
      //   type: "spring",
      //   stiffness: 100,
      // }}
      // onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative mb-5 flex overflow-hidden rounded-xl bg-white/80 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 last:mb-0 hover:shadow-2xl dark:bg-slate-800/80 dark:shadow-slate-700/20"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="bg-grid-white/[0.02] absolute inset-0 bg-[size:20px_20px] [mask-image:linear-gradient(0deg,white,transparent)]" />

      <div className="relative mr-5">
        <div className="relative h-[135px] w-[240px] overflow-hidden rounded-lg shadow-md">
          <Image
            src={`https://img.youtube.com/vi/${video.baseVideoURL.split("=")[1]}/0.jpg`}
            alt="Video thumbnail"
            fill
            className="transform object-cover transition-transform duration-300 group-hover:scale-105"
            priority={false}
            unoptimized
          />
        </div>
      </div>

      <div className="relative flex w-80 flex-col">
        <Link
          href={`/video/${video.vidID}`}
          className="text-xl font-semibold text-blue-600 transition-colors duration-300 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {video.vidTitle}
        </Link>

        <p className="mt-2 text-slate-700 dark:text-slate-200">
          {video.vidDescription}
        </p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {video.vidMoreInfo}
        </p>
        <div className="mt-auto pt-4">
          <GalleryIcons
            id={video.vidID}
            handleDelete={handleDelete}
            deleting={deleting}
            alert={alert}
          />
        </div>
      </div>
    </motion.div>
  );
};
