"use client";

import React from "react";

interface Props {
  title: string;
  status: "Pending" | "Done";
}

export default function UploadItem({ title, status }: Props) {
  return (
    <div className="mb-2 flex justify-between text-slate-700">
      <p>{title}</p>
      <p className={status === "Pending" ? "text-sky-500" : "text-green-500"}>
        {status}
      </p>
    </div>
  );
}
