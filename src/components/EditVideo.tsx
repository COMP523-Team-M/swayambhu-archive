"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { VideoData } from "@/app/api/elasticsearch/CRUD/get-video/route";

export default function EditVideo() {
  const { id } = useParams();
  const router = useRouter();

  const [alert, setShowAlert] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<VideoData | null>(null);

  const getVideo = async () => {
    const response = await fetch(
      `/api/elasticsearch/CRUD/get-video?vidID=${id}`,
    );
    const fetchedData: VideoData = await response.json();
    setData(fetchedData);
  };

  useEffect(() => {
    getVideo();
  }, []);

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto"; // Reset the height to auto so it can shrink
    e.target.style.height = `${e.target.scrollHeight}px`; // Set to the scrollHeight for auto expansion
  };

  const handleFormsubmit = (data: React.FormEvent<HTMLFormElement>) => {
    data.preventDefault();
    const form = new FormData(data.currentTarget);

    const transcription = form.getAll("transcriptUpdates") as string[];
    const transcriptionUpdates = transcription.map((value, index) => {
      return {
        segmentIndex: index,
        newTranscript: value,
      };
    });

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
    // fetch("http://localhost:3000/api/elasticsearch/CRUD/update-video", {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(body),
    // }).then(() => setShowAlert(true));

    new Promise((resolve) => setTimeout(() => resolve("yeet"), 3000)).then(
      () => {
        setUploading(false);
        setTimeout(() => router.push("/dashboard"), 2000);
      },
    );
  };

  useEffect(() => {
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, [data]);

  if (!data) {
    return <h1>Loading...</h1>;
  }

  return (
    <>
      <h1 className="mb-5 text-3xl font-bold text-slate-700 dark:text-slate-200">
        Edit Video
      </h1>
      <form className="w-1/2" onSubmit={handleFormsubmit}>
        <label className="block">Title</label>
        <input
          required
          placeholder="A nice video"
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
          type="text"
          value={data.vidTitle}
          onChange={(e) =>
            setData((prevData) => ({ ...prevData!, vidTitle: e.target.value }))
          }
          name="vidTitle"
        />

        <label className="block">YouTube link</label>
        <input
          required
          placeholder="Enter link"
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
          type="text"
          value={data.baseVideoURL}
          onChange={(e) =>
            setData((prevData) => ({
              ...prevData!,
              baseVideoURL: e.target.value,
            }))
          }
          name="baseVideoURL"
        />

        <label className="block">Video description</label>
        <textarea
          required
          placeholder="An interview about..."
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
          value={data.vidDescription}
          onChange={(e) =>
            setData((prevData) => ({
              ...prevData!,
              vidDescription: e.target.value,
            }))
          }
          name="vidDescription"
        />

        <label className="block">Upload date</label>
        <input
          required
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
          type="date"
          value={data.uploadDate}
          onChange={(e) =>
            setData((prevData) => ({
              ...prevData!,
              uploadDate: e.target.value,
            }))
          }
          name="uploadDate"
        />

        <label className="block">Date of recording</label>
        <input
          required
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
          type="date"
          value={data.recordDate}
          onChange={(e) =>
            setData((prevData) => ({
              ...prevData!,
              recordDate: e.target.value,
            }))
          }
          name="recordDate"
        />

        <label className="block">Location of recording</label>
        <input
          required
          placeholder="Nepal"
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
          type="text"
          value={data.location}
          onChange={(e) =>
            setData((prevData) => ({ ...prevData!, location: e.target.value }))
          }
          name="location"
        />

        <label className="block">Tags (Comma separated list)</label>
        <input
          placeholder="Comma separated list (temple, tourist, monk)"
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
          type="text"
          value={data.tags ? data.tags.join(", ") : ""}
          onChange={(e) => {
            const tags = e.target.value.split(",").map((tag) => tag.trim());
            setData((prevData) => ({ ...prevData!, tags: tags }));
          }}
          name="tags"
        />

        <label className="mb-3 block">Transcript</label>
        {data.englishTranscriptJson.results.map((line, index) => {
          return (
            <div className="flex" key={index}>
              <label className="mr-5 mt-1 w-10 text-sky-500 dark:text-sky-400">
                {data.transcriptJson.results[index].resultEndOffset}
              </label>
              <textarea
                className="mb-3 min-h-5 w-full resize-none overflow-auto rounded-lg p-1 px-2 text-sm outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-sky-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
                value={line.alternatives[0].transcript}
                onChange={(e) => {
                  const newTranscript = e.target.value;

                  setData((prevData) => {
                    if (!prevData) return prevData; // Ensure prevData is not null

                    // Create a copy of the existing data to update
                    const updatedData = { ...prevData };

                    // Update the specific transcript line
                    updatedData.englishTranscriptJson.results[
                      index
                    ].alternatives[0].transcript = newTranscript;

                    return updatedData;
                  });
                  handleTextareaResize(e);
                }}
                name="transcriptUpdates"
              />
            </div>
          );
        })}
        <div className="mt-5 flex justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-1/5 rounded-lg bg-sky-500 p-2 text-white hover:outline hover:outline-sky-600 dark:hover:outline-sky-400"
          >
            Back
          </button>
          <button
            className="w-1/5 rounded-lg bg-sky-500 p-2 text-white hover:outline hover:outline-sky-600 dark:hover:outline-sky-400"
            type="submit"
          >
            Submit
          </button>
        </div>
      </form>

      {alert && (
        <div
          className="fixed bottom-5 rounded border border-slate-600 bg-slate-900 px-4 py-3 text-white"
          role="alert"
        >
          <span className="block sm:inline">
            {uploading ? "Updating video..." : "Video updated successfully"}
          </span>
        </div>
      )}
    </>
  );
}
