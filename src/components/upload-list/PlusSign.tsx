"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { FaPlus } from "react-icons/fa6";

export default function PlusSign() {
  const router = useRouter();

  return (
    <FaPlus
      className="self-center text-sm hover:cursor-pointer hover:text-sky-500"
      onClick={() => router.push("/dashboard/upload")}
    />
  );
}
