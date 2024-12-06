"use client";

import { Upload } from "@/app/dashboard/page";
import React, { useEffect, useState } from "react";

interface Props {
  title: string;
  status: "Pending" | "Done";
}

export default function UploadItem({ title, status }: Props) {
  return (
    <div className="mb-2 flex justify-between">
      <p>{title}</p>
      <p className={status === "Pending" ? "text-red-500" : "text-green-500"}>
        {status}
      </p>
    </div>
  );
}
