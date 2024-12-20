"use client";

import React from "react";
import VideoGallery from "@/components/video-gallery/VideoGallery";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="my-10"
    >
      <VideoGallery />
    </motion.div>
  );
}
