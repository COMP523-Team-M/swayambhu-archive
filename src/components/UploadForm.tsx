"use client";

import { useUploadContext } from "@/context";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();

  const { addUpload, updateStatus } = useUploadContext();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const vidTitle = formData.get("vidTitle") as string;
    const vidDescription = formData.get("vidDescription") as string;
    const uploadDate = formData.get("uploadDate") as string;
    const recordDate = formData.get("recordDate") as string;
    const location = formData.get("location") as string;
    const baseVideoURL = formData.get("baseVideoURL") as string;
    const file = formData.get("audio") as File;

    const fileBase64 = await toBase64(file);

    const payload = {
      vidTitle,
      vidDescription,
      uploadDate,
      recordDate,
      location,
      baseVideoURL,
      audio: {
        name: file.name,
        type: file.type,
        content: fileBase64, // Base64 string
      },
    };

    const title = vidTitle;
    addUpload({ title, status: "Pending" });

    // fetch("http://localhost:3000/api/elasticsearch/CRUD/add-video", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(payload),
    // }).then(() => updateStatus(title, "Done"));

    new Promise((resolve) => setTimeout(() => resolve("wow"), 5000)).then(() =>
      updateStatus(title, "Done"),
    );

    router.push("/dashboard");
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
    <>
      <h1 className="mb-5 text-3xl font-bold">Upload Video</h1>
      <form className="w-1/2" onSubmit={handleSubmit}>
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
          className="mb-5 min-h-10 w-full rounded-lg p-1 px-2 text-sm shadow-md outline-none ring-[0.5px] ring-gray-400 transition-colors duration-300 focus:ring-2 focus:ring-blue-200"
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

        <label className="mb-2 block">Audio file to transcribe</label>
        <input required className="mb-5 block" type="file" name="audio" />

        <div className="flex justify-between">
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
