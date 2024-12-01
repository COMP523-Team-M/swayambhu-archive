"use client";

import { Upload } from "@/app/dashboard/page";
import React, { useEffect, useState } from "react";

interface Props {
  item: Upload;
}

export default function UploadItem({ item }: Props) {
  const [status, setStatus] = useState("Pending");

  useEffect(() => {
    item.upload.then(() => setStatus("Done"));
  }, [item]);

  return (
    <div className="mb-2 flex justify-between">
      <p>{item.name}</p>
      <p className={`text-${status === "Pending" ? "red" : "green"}-500`}>
        {status}
      </p>
    </div>
  );
}
