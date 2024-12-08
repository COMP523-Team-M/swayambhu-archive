"use client";

import React from "react";
import { motion } from "framer-motion";
import { FiClock, FiCheck, FiAlertCircle, FiX } from "react-icons/fi";
import { useUploadContext } from "@/context/Uploads";

interface Props {
  title: string;
  status: "Pending" | "Done" | "Error";
}

export default function UploadItem({ title, status }: Props) {
  const { deleteUpload } = useUploadContext();

  const statusConfig = {
    Pending: {
      icon: FiClock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    Done: {
      icon: FiCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    Error: {
      icon: FiAlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
  };

  const {
    icon: StatusIcon,
    color,
    bgColor,
    borderColor,
  } = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative mb-2 overflow-hidden rounded-lg border bg-white/50 p-3 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:bg-slate-800/80"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 to-slate-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="group relative"
          >
            <FiX
              onClick={() => deleteUpload(title)}
              className="mr-3 cursor-pointer hover:text-blue-500"
            />
          </motion.div>
          <p className="truncate text-slate-700 dark:text-slate-200">{title}</p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full ${bgColor} ${borderColor} border px-3 py-1`}
        >
          <StatusIcon className={`h-4 w-4 ${color}`} />
          <span className={`text-sm font-medium ${color}`}>{status}</span>
        </div>
      </div>
    </motion.div>
  );
}
