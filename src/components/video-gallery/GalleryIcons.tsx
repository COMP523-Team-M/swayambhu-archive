"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { BsPencilFill } from "react-icons/bs";
import { FaTrashAlt } from "react-icons/fa";

interface Props {
  id: string;
}

export default function GalleryIcons({ id }: Props) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/dashboard/edit/${id}`);
  };

  const handleTrash = () => {
    // fetch(`/api/delete-video/vidID=${id}`, {
    //     method: "DELETE",
    //     body: id
    // })
  };

  return (
    <div className="mb-5 mt-auto self-end">
      <BsPencilFill
        onClick={handleEdit}
        className="mr-4 inline cursor-pointer hover:text-sky-500 dark:hover:text-sky-400"
      ></BsPencilFill>
      <FaTrashAlt
        onClick={handleTrash}
        className="inline cursor-pointer hover:text-sky-500 dark:hover:text-sky-400"
      ></FaTrashAlt>
    </div>
  );
}
