"use client";

import React from "react";

interface Props {
  title: string;
  status: "Pending" | "Done" | "Error";
}

export default function UploadItem({ title, status }: Props) {
  return (
    <div className="mb-2 flex justify-between text-slate-700 dark:text-slate-200">
      <p>{title}</p>
      <p
        className={
          status === "Pending"
            ? "text-sky-500"
            : status === "Done"
              ? "text-green-500"
              : "text-red-600"
        }
      >
        {status}
      </p>
    </div>
  );
}
