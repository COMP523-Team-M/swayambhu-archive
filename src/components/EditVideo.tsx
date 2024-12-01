"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function EditVideo() {
  interface Line {
    timestamp: string;
    text: string;
  }

  interface Transcript {
    results: Line[];
  }

  const line1: Line = { timestamp: "00:00", text: "Hello world" };
  const line2: Line = {
    timestamp: "00:10",
    text: "The quick brown fox jumped over the lazy dog and then it decided to get some tacos later because it enjoys Mexican food in fact his best friend is Mexican how bout that? What are the odds you know small world right? lol well anyway xd memes",
  };
  const line3: Line = {
    timestamp: "00:20",
    text: "I think you should try getting a different job.",
  };

  const transcript: Transcript = { results: [line1, line2, line3] };

  const { id } = useParams();
  const router = useRouter();

  const [input, setInput] = useState(
    transcript.results.map((line) => line.text),
  );

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newInput = [...input];
    newInput[index] = e.target.value;
    setInput(newInput);
  };

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto"; // Reset the height to auto so it can shrink
    e.target.style.height = `${e.target.scrollHeight}px`; // Set to the scrollHeight for auto expansion
  };

  useEffect(() => {
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }, []);

  return (
    <>
      <h1 className="mb-5 text-3xl font-bold">Edit Video</h1>
      <form
        className="w-1/2"
        onSubmit={(data) => {
          data.preventDefault();
          const form = new FormData(data.currentTarget);
          console.log(form.getAll("yeet"));
        }}
      >
        <label className="block">Title</label>
        <input
          required
          placeholder="A nice video"
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-200"
          type="text"
          name="vidTitle"
        />

        <label className="block">YouTube link</label>
        <input
          required
          placeholder="Enter link"
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-200"
          type="text"
          name="baseVideoURL"
        />

        <label className="block">Video description</label>
        <textarea
          required
          placeholder="An interview about..."
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-200"
          name="vidDescription"
        />

        <label className="block">Upload date</label>
        <input
          required
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-200"
          type="date"
          name="uploadDate"
        />

        <label className="block">Date of recording</label>
        <input
          required
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-200"
          type="date"
          name="recordDate"
        />

        <label className="block">Location of recording</label>
        <input
          required
          placeholder="Nepal"
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-200"
          type="text"
          name="location"
        />

        <label className="block">Tags (Comma separated list)</label>
        <input
          placeholder="Comma separated list (temple, tourist, monk)"
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-all duration-300 focus:ring-2 focus:ring-blue-200"
          type="text"
          name="tags"
        />

        <label className="mb-3 block">Transcript</label>
        {transcript.results.map((line, index) => {
          return (
            <div className="flex" key={index}>
              <label className="mr-5 mt-1 text-blue-500">
                {line.timestamp}
              </label>
              <textarea
                className="mb-3 min-h-5 w-full resize-none overflow-auto rounded-lg p-1 px-2 text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-blue-200"
                value={input[index]}
                onChange={(e) => {
                  handleChange(index, e);
                  handleTextareaResize(e);
                }}
                name="yeet"
              />
            </div>
          );
        })}
        <div className="mt-5 flex justify-between">
          <button
            className="w-1/5 rounded-lg bg-blue-200 p-2 hover:outline hover:outline-blue-300"
            type="submit"
          >
            Submit
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-1/5 rounded-lg bg-blue-200 p-2 hover:outline hover:outline-blue-300"
          >
            Back
          </button>
        </div>
      </form>
    </>
  );
}
