import React from "react";
import PlusSign from "./PlusSign";

interface Props {
  uploadList: string[];
}

export default function UploadList({ uploadList }: Props) {
  return (
    <>
      <div className="flex max-h-max min-h-96 w-80 flex-col rounded-3xl border-2 p-8 shadow-xl">
        <h2 className="mb-4 flex justify-between border-b-2 p-2 text-2xl font-bold">
          <span>Uploads</span>
          <PlusSign />
        </h2>
        {uploadList.map((entry, index) => {
          return (
            <p className="mb-2" key={index}>
              <span>{entry}</span>
              <span className="text-green-500">Yeet</span>
            </p>
          );
        })}
      </div>
    </>
  );
}
