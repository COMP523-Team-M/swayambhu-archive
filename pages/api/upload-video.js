// pages/api/upload-video.js
import { uploadVideo } from "../../utils/uploadVideo";
import { oauth2Client } from "../../utils/youtube";
import { getTokens } from "../../utils/tokenUtils";
import { generateTranscript } from "../../utils/generateTranscript";
import client from "../../utils/elasticsearch";
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // Retrieve tokens with auto-refresh if needed
      const tokens = await getTokens();
      if (tokens) {
        oauth2Client.setCredentials(tokens);
      } else {
        return res.status(401).json({
          message: "No valid access or refresh token. Please authenticate with Google first by visiting /api/auth.",
        });
      }

      // Extract video details from request body
      const { title, description, tags } = req.body;

      // Upload video to YouTube
      const uploadResponse = await uploadVideo(title, description, tags);
      const videoId = uploadResponse.id;
      const baseVideoURL = `https://www.youtube.com/watch?v=${videoId}`;

      //  Generate transcript using OpenAI Whisper
      const transcript = await generateTranscript(baseVideoURL);

      //  Add video and transcript to Elasticsearch
      const vidID = uuidv4();

      // Index full video metadata
      await client.index({
        index: 'videos',
        id: vidID,
        body: {
          vidID,
          vidDescription: description,
          uploadDate: new Date().toISOString(),
          recordDate: new Date().toISOString(), 
          location: "Unknown", // Add location if applicable
          transcript, // Full transcript for reference
          tags,
          baseVideoURL, // Store base video URL in the videos index
        },
      });

      // Step 4: Segment transcript and index snippets
      const transcriptSegments = splitTranscript(transcript, 25); // 25 words per segment
      for (let i = 0; i < transcriptSegments.length; i++) {
        const transcriptSnippet = transcriptSegments[i];
        const transcriptID = uuidv4();
        const timeSegment = i * 10; // Assuming that each segment corresponds to 10 seconds
        const videoLinkToSnippet = `${baseVideoURL}&t=${timeSegment}s`;

        await client.index({
          index: 'video_snippets',
          id: transcriptID,
          body: {
            transcriptID,
            vidID,
            timeSegment,
            transcriptSnippet,
            videoLinkToSnippet,
          },
        });
      }

      res.status(200).json({
        message: "Video uploaded and indexed successfully",
        videoData: uploadResponse,
      });
    } catch (error) {
      console.error("Error in /upload-video route:", error);
      res.status(500).json({ message: "Error uploading and indexing video" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function splitTranscript(transcript, segmentLength = 25) {
  const words = transcript.split(" ");
  const segments = [];
  let segment = [];
  let wordCount = 0;

  words.forEach((word) => {
    segment.push(word);
    wordCount += 1;
    if (wordCount >= segmentLength) {
      segments.push(segment.join(" "));
      segment = [];
      wordCount = 0;
    }
  });

  if (segment.length > 0) {
    segments.push(segment.join(" "));
  }
  return segments;
}
