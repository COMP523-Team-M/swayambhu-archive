"use client";

import PlusSign from "./PlusSign";
import UploadItem from "./UploadItem";
import { useUploadContext } from "@/context/Uploads";
import { motion, AnimatePresence } from "framer-motion";
import { FiUploadCloud } from "react-icons/fi";

export default function UploadList() {
  const { uploads } = useUploadContext();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-pink-500/5 blur-xl" />

      <div className="relative flex min-h-96 w-96 flex-col overflow-hidden rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur-xl transition-all duration-500 hover:shadow-2xl dark:bg-slate-800/80">
        {/* Header */}
        <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="mb-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <FiUploadCloud className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              <h2 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-2xl font-bold text-transparent dark:from-slate-200 dark:to-slate-400">
                Uploads
              </h2>
            </div>
            <PlusSign />
          </div>
        </motion.div>

        {/* Upload Items */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {uploads.map((upload, index) => (
              <motion.div
                key={upload.title + index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <UploadItem title={upload.title} status={upload.status} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Empty state */}
        {uploads.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center text-slate-400"
          >
            <FiUploadCloud className="mb-2 h-12 w-12" />
            <p className="text-center text-sm">No uploads yet</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
