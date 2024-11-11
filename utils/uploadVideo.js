// utils/uploadVideo.js
import { youtube, oauth2Client, VIDEO_PATH } from "./youtube";
import fs from "fs";

export async function uploadVideo(title, description, tags) {
  if (!oauth2Client.credentials) {
    throw new Error("User not authenticated. Please authenticate first.");
  }

  const videoMetadata = {
    snippet: {
      title: title || "Default Title",
      description: description || "Default Description",
      tags: tags || ["default-tag"],
      categoryId: "22", // People & Blogs category ID
    },
    status: {
      privacyStatus: "private", 
    },
  };

  const response = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: videoMetadata,
    media: {
      body: fs.createReadStream(VIDEO_PATH),
    },
  });

  console.log("Video uploaded successfully:", response.data);
  return response.data;  // Ensure the caller gets the video ID and other metadata
}
