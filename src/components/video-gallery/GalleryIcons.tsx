"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import React from "react";
import { BsPencilFill } from "react-icons/bs";
import { FaTrashAlt } from "react-icons/fa";
import { FiLoader, FiCheck } from "react-icons/fi";

interface Props {
  id: string;
  handleDelete: () => void;
  deleting: boolean;
  alert: boolean;
}

export default function GalleryIcons({
  id,
  handleDelete,
  deleting,
  alert,
}: Props) {
  const router = useRouter();

  const handleEdit = () => {
    if (alert) return;

    router.push(`/dashboard/edit/${id}`);
  };

  return (
    <>
      <div className="mb-5 mt-auto self-end">
        <BsPencilFill
          onClick={handleEdit}
          className={`mr-4 inline hover:text-sky-500 dark:hover:text-sky-400 ${alert ? "cursor-not-allowed text-slate-500" : "cursor-pointer"}`}
        ></BsPencilFill>
        <FaTrashAlt
          onClick={handleDelete}
          className={`inline hover:text-sky-500 dark:hover:text-sky-400 ${alert ? "cursor-not-allowed text-slate-500" : "cursor-pointer"}`}
        ></FaTrashAlt>
      </div>

      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 right-5 overflow-hidden rounded-lg bg-white/80 shadow-lg backdrop-blur-sm dark:bg-slate-800/80"
          >
            <div className="relative px-6 py-4">
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-purple-500">
                {deleting && (
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3 }}
                    className="h-full bg-blue-500"
                  />
                )}
              </div>
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                {deleting ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Deleting video...
                  </>
                ) : (
                  <>
                    <FiCheck className="text-green-500" />
                    Video deleted successfully
                  </>
                )}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
