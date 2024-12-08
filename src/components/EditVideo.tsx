"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { VideoData } from "@/app/api/elasticsearch/CRUD/get-video/route";
import { motion, AnimatePresence } from "framer-motion";
import { FiLoader, FiCheck, FiEdit3 } from "react-icons/fi";

export default function EditVideo() {
  const { id } = useParams();
  const router = useRouter();

  const [alert, setShowAlert] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changed, setChanged] = useState(false);
  const [data, setData] = useState<VideoData | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);

  useEffect(() => {
    const getVideo = async () => {
      const response = await fetch(
        `/api/elasticsearch/CRUD/get-video?vidID=${id}`,
      );
      const fetchedData: VideoData = await response.json();
      setData(fetchedData);
      console.log(fetchedData);
    };
    getVideo();
  }, [id]);

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleFormsubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    console.log(data);

    const enTranscription = form.getAll("enTranscriptUpdates") as string[];
    const neTranscription = form.getAll("neTranscriptUpdates") as string[];

    const enString = enTranscription.join(" ");
    const neString = neTranscription.join(" ");

    console.log(enString);
    console.log(neString);

    let type: "english" | "nepali" | "both";
    if (
      enString !== data?.englishTranslation &&
      neString !== data?.transcript
    ) {
      type = "both";
    } else if (enString !== data?.englishTranslation) {
      type = "english";
    } else type = "nepali";

    const transcriptionUpdates = transcription.map((value, index) => ({
      segmentIndex: index,
      newTranscript: value,
    }));

    console.log(transcriptionUpdates);

    const body = {
      vidID: id,
      vidTitle: form.get("vidTitle"),
      baseVideoURL: form.get("baseVideoURL"),
      vidDescription: form.get("vidDescription"),
      uploadDate: form.get("uploadDate"),
      recordDate: form.get("recordDate"),
      location: form.get("location"),
      tags: form.get("tags"),
      transcriptUpdates: transcriptionUpdates,
    };

    setUploading(true);
    setShowAlert(true);

    fetch("http://localhost:3000/api/elasticsearch/CRUD/update-video", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(() => {
      setUploading(false);
      setTimeout(() => router.push("/dashboard"), 2000);
    });

    // new Promise((resolve) => setTimeout(() => resolve("yeet"), 3000)).then(
    //   () => {
    //     setUploading(false);
    //     setTimeout(() => router.push("/dashboard"), 2000);
    //   },
    // );
  };

  useEffect(() => {
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, [data]);

  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <FiLoader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-3xl"
    >
      <div className="mb-8 flex items-center gap-3">
        <FiEdit3 className="h-8 w-8 text-blue-500" />
        <h1 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-3xl font-bold text-transparent dark:from-slate-200 dark:to-slate-400">
          Edit Video
        </h1>
      </div>

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
        onSubmit={handleFormsubmit}
      >
        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Title
            </label>
            <input
              required
              placeholder="A nice video"
              className="w-full rounded-lg bg-white/50 p-3 text-sm shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
              type="text"
              value={data.vidTitle}
              onChange={(e) => {
                setData((prevData) => ({
                  ...prevData!,
                  vidTitle: e.target.value,
                }));
                setChanged(true);
              }}
              name="vidTitle"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              YouTube link
            </label>
            <input
              required
              placeholder="Enter link"
              className="w-full rounded-lg bg-white/50 p-3 text-sm shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
              type="text"
              value={data.baseVideoURL}
              onChange={(e) => {
                setData((prevData) => ({
                  ...prevData!,
                  baseVideoURL: e.target.value,
                }));
                setChanged(true);
              }}
              name="baseVideoURL"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Video description
          </label>
          <textarea
            required
            placeholder="An interview about..."
            className="min-h-fit w-full rounded-lg bg-white/50 p-3 text-sm shadow-md outline-none ring-1 ring-slate-200 transition-colors duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
            value={data.vidDescription}
            onChange={(e) => {
              setData((prevData) => ({
                ...prevData!,
                vidDescription: e.target.value,
              }));
              setChanged(true);
            }}
            name="vidDescription"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Upload date
            </label>
            <input
              required
              className="w-full rounded-lg bg-white/50 p-3 text-sm shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700"
              type="date"
              value={data.uploadDate}
              onChange={(e) => {
                setData((prevData) => ({
                  ...prevData!,
                  uploadDate: e.target.value,
                }));
                setChanged(true);
              }}
              name="uploadDate"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Date of recording
            </label>
            <input
              required
              className="w-full rounded-lg bg-white/50 p-3 text-sm shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700"
              type="date"
              value={data.recordDate}
              onChange={(e) => {
                setData((prevData) => ({
                  ...prevData!,
                  recordDate: e.target.value,
                }));
                setChanged(true);
              }}
              name="recordDate"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Location of recording
            </label>
            <input
              required
              placeholder="Nepal"
              className="w-full rounded-lg bg-white/50 p-3 text-sm shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
              type="text"
              value={data.location}
              onChange={(e) => {
                setData((prevData) => ({
                  ...prevData!,
                  location: e.target.value,
                }));
                setChanged(true);
              }}
              name="location"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tags
            </label>
            <input
              placeholder="temple, tourist, monk"
              className="w-full rounded-lg bg-white/50 p-3 text-sm shadow-md outline-none ring-1 ring-slate-200 transition-all duration-300 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700 dark:placeholder:text-slate-600"
              type="text"
              value={data.tags ? data.tags.join(", ") : ""}
              onChange={(e) => {
                const tags = e.target.value.split(",").map((tag) => tag.trim());
                setData((prevData) => ({ ...prevData!, tags: tags }));
                setChanged(true);
              }}
              name="tags"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Transcript
            </label>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={showEnglish}
                onChange={(e) => setShowEnglish(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-slate-700 dark:peer-focus:ring-blue-800"></div>
              <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                {showEnglish ? "English" : "नेपाली"}
              </span>
            </label>
          </div>
          <div className={`${!showEnglish && "hidden"} flex flex-col gap-4`}>
            {data.englishTranscriptJson.results.map((line, index) => (
              <div className="flex gap-4" key={index}>
                <span className="mt-3 w-16 text-sm font-medium text-blue-500">
                  {data.transcriptJson.results[index].resultEndOffset}
                </span>
                <textarea
                  className="min-h-fit w-full rounded-lg bg-white/50 p-3 text-sm shadow-md outline-none ring-1 ring-slate-200 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700"
                  value={line.alternatives[0].transcript}
                  onChange={(e) => {
                    const newTranscript = e.target.value;
                    setData((prevData) => {
                      if (!prevData) return prevData;
                      const updatedData = { ...prevData };
                      updatedData.englishTranscriptJson.results[
                        index
                      ].alternatives[0].transcript = newTranscript;
                      return updatedData;
                    });
                    setChanged(true);
                    handleTextareaResize(e);
                  }}
                  name="neTranscriptUpdates"
                />
              </div>
            ))}
          </div>

          <div className={`${showEnglish && "hidden"} flex flex-col gap-4`}>
            {data.transcriptJson.results.map((line, index) => (
              <div className="flex gap-4" key={index}>
                <span className="mt-3 w-16 text-sm font-medium text-blue-500">
                  {line.resultEndOffset}
                </span>
                <textarea
                  className="min-h-fit w-full rounded-lg bg-white/50 p-3 text-sm shadow-md outline-none ring-1 ring-slate-200 transition-colors duration-300 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700"
                  value={line.alternatives[0].transcript}
                  onChange={(e) => {
                    const newTranscript = e.target.value;
                    setData((prevData) => {
                      if (!prevData) return prevData;
                      const updatedData = { ...prevData };
                      updatedData.transcriptJson.results[
                        index
                      ].alternatives[0].transcript = newTranscript;
                      return updatedData;
                    });
                    setChanged(true);
                    handleTextareaResize(e);
                  }}
                  name="enTranscriptUpdates"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-between gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => router.push("/dashboard")}
            className="group relative w-32 overflow-hidden rounded-lg bg-white/50 p-3 text-slate-800 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg dark:bg-slate-800/50 dark:text-slate-200"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 via-slate-500/10 to-slate-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">Back</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={alert || !changed}
            className="group relative w-32 overflow-hidden rounded-lg bg-blue-500 p-3 text-white shadow-md transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-500"
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
                    Updating video...
                  </>
                ) : (
                  <>
                    <FiCheck className="text-green-500" />
                    Video updated successfully
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
