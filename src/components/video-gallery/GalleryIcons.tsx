"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { BsPencilFill } from "react-icons/bs";
import { FaTrashAlt } from "react-icons/fa";

interface Props {
  id: string;
}

export default function GalleryIcons({ id }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/dashboard/edit/${id}`);
  };

  const handleTrash = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/elasticsearch/CRUD/delete-video?vidID=${id}`,
        {
          method: "DELETE",
          body: id,
        },
      );

      if (response.ok) {
        router.refresh(); // Refresh the current route to reflect changes
      } else {
        console.error("Failed to delete the item");
      }
    } catch (error) {
      console.error("Error occurred during deletion:", error);
    } finally {
      setIsDeleting(false); // Reset deleting state
    }
  };

  return (
    <div className="mb-5 mt-auto self-end">
      <BsPencilFill
        onClick={handleEdit}
        className={`mr-4 inline cursor-pointer ${isDeleting ? "text-gray-400" : "hover:text-sky-500 dark:hover:text-sky-400"}`}
      ></BsPencilFill>
      <FaTrashAlt
        onClick={handleTrash}
        className={`inline cursor-pointer ${isDeleting ? "text-gray-400" : "hover:text-sky-500 dark:hover:text-sky-400"}`}
      ></FaTrashAlt>
    </div>
  );
}
