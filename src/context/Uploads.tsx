"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface Upload {
  title: string;
  status: "Pending" | "Done" | "Error";
}

interface UploadContextProps {
  uploads: Upload[];
  addUpload: (upload: Upload) => void;
  updateStatus: (title: string, status: "Pending" | "Done" | "Error") => void;
}

const UploadContext = createContext<UploadContextProps | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isHydrated, setIsHydrated] = useState(false); // Track hydration state

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUploads = localStorage.getItem("uploads");
      if (storedUploads) {
        setUploads(JSON.parse(storedUploads));
      }
      setIsHydrated(true); // Mark hydration as complete
    }
  }, []);

  const addUpload = (upload: Upload) => {
    setUploads((prev) => [upload, ...prev]);
  };

  const updateStatus = (
    title: string,
    status: "Pending" | "Done" | "Error",
  ) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.title === title ? { ...upload, status } : upload,
      ),
    );
  };

  useEffect(() => {
    if (typeof window !== "undefined" && isHydrated) {
      localStorage.setItem("uploads", JSON.stringify(uploads));
    }
  }, [uploads, isHydrated]);

  return (
    <UploadContext.Provider value={{ uploads, addUpload, updateStatus }}>
      {children}
    </UploadContext.Provider>
  );
}

export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (!context)
    throw new Error("useUploadContext must be used within UploadProvider");
  return context;
};
