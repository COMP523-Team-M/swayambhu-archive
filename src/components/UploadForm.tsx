"use client";

import { useUploadContext } from "@/context/Uploads";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiLoader, FiCheck, FiUpload } from "react-icons/fi";
import { useState } from "react";

export default function UploadForm() {
  const router = useRouter();
  const { addUpload, updateStatus } = useUploadContext();
  const [alert, setShowAlert] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setShowAlert(true);
    
    const formData = new FormData(e.currentTarget);
    const vidTitle = formData.get("vidTitle") as string;
    const vidDescription = formData.get("vidDescription") as string;
    const uploadDate = formData.get("uploadDate") as string;
    const recordDate = formData.get("recordDate") as string;
    const location = formData.get("location") as string;
    const baseVideoURL = formData.get("baseVideoURL") as string;
    const file = formData.get("audio") as File;
    const temp = formData.get("tags") as string;
    const tags = temp.replace(/\s+/g, "").split(",");

    const fileBase64 = await toBase64(file);

    const payload = {
      vidTitle,
      vidDescription,
      uploadDate,
      recordDate,
      location,
      baseVideoURL,
      tags,
      audio: {
        name: file.name,
        type: file.type,
        content: fileBase64,
      },
    };

    const title = vidTitle;
    addUpload({ title, status: "Pending" });

    try {
      await fetch("/api/elasticsearch/CRUD/add-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      updateStatus(title, "Done");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error) {
      console.log(error);
      updateStatus(title, "Error");
    } finally {
      setUploading(false);
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-3xl"
    >
      <div className="mb-8 flex items-center gap-3">
        <FiUpload className="h-8 w-8 text-blue-500" />
        <h1 className="font-display bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-200 dark:to-slate-400">
          Upload Video
        </h1>
      </div>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
        onSubmit={handleSubmit}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium font-sans text-slate-700 dark:text-slate-300">Title</label>
          <input
            required
            placeholder="A nice video"
            className="w-full rounded-lg bg-white/50 p-3 text-sm font-sans shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
            type="text"
            name="vidTitle"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium font-sans text-slate-700 dark:text-slate-300">YouTube link</label>
          <input
            required
            placeholder="Enter link"
            className="w-full rounded-lg bg-white/50 p-3 text-sm font-sans shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
            type="text"
            name="baseVideoURL"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium font-sans text-slate-700 dark:text-slate-300">Video description</label>
          <textarea
            required
            placeholder="An interview about..."
            className="w-full rounded-lg bg-white/50 p-3 text-sm font-sans shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
            name="vidDescription"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium font-sans text-slate-700 dark:text-slate-300">Upload date</label>
          <input
            required
            className="w-full rounded-lg bg-white/50 p-3 text-sm font-sans shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700"
            type="date"
            name="uploadDate"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium font-sans text-slate-700 dark:text-slate-300">Date of recording</label>
          <input
            required
            className="w-full rounded-lg bg-white/50 p-3 text-sm font-sans shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700"
            type="date"
            name="recordDate"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium font-sans text-slate-700 dark:text-slate-300">Location of recording</label>
          <input
            required
            placeholder="Nepal"
            className="w-full rounded-lg bg-white/50 p-3 text-sm font-sans shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
            type="text"
            name="location"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium font-sans text-slate-700 dark:text-slate-300">Tags (Comma separated list)</label>
          <input
            placeholder="temple, tourist, monk"
            className="w-full rounded-lg bg-white/50 p-3 text-sm font-sans shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
            type="text"
            name="tags"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium font-sans text-slate-700 dark:text-slate-300">Audio file to transcribe</label>
          <input 
            required 
            type="file" 
            name="audio"
            className="w-full rounded-lg bg-white/50 p-3 text-sm font-sans shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700"
          />
        </div>

        <div className="mt-8 flex justify-between gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/dashboard")}
            className="group relative w-32 overflow-hidden rounded-lg bg-white/50 p-3 font-sans text-slate-800 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg dark:bg-slate-800/50 dark:text-slate-200"
            type="button"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 via-slate-500/10 to-slate-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">Back</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="group relative w-32 overflow-hidden rounded-lg bg-blue-500 p-3 font-sans text-white shadow-md transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/50 to-blue-500/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">Submit</span>
          </motion.button>
        </div>
      </motion.form>

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
                {uploading && (
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3 }}
                    className="h-full bg-blue-500"
                  />
                )}
              </div>
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                {uploading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Uploading video...
                  </>
                ) : (
                  <>
                    <FiCheck className="text-green-500" />
                    Video uploaded successfully
                  </>
                )}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}