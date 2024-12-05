"use client";

import PlusSign from "./PlusSign";
import UploadItem from "./UploadItem";
import { useUploadContext } from "@/context";

export default function UploadList() {
  const { uploads } = useUploadContext();

  return (
    <>
      <div className="flex max-h-max min-h-96 w-80 flex-col rounded-3xl border p-8 shadow-xl">
        <h2 className="mb-4 flex justify-between border-b-2 p-2 text-2xl font-bold">
          <span>Uploads</span>
          <PlusSign />
        </h2>
        {uploads.map((upload, index) => {
          return (
            <UploadItem
              title={upload.title}
              key={index}
              status={upload.status}
            />
          );
        })}
      </div>
    </>
  );
}
