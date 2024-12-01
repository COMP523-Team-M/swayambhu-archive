import { NextRequest, NextResponse } from "next/server";
import client from "@/utils-ts/elasticsearch";

// Using types from add-video route
interface TranscriptWord {
  startOffset?: string;
  endOffset: string;
  word: string;
  confidence: number;
}

interface TranscriptAlternative {
  transcript: string;
  confidence: number;
  words: TranscriptWord[];
}

interface TranscriptResult {
  alternatives: TranscriptAlternative[];
  resultEndOffset?: string;
  languageCode?: string;
}

interface TranscriptJson {
  results: TranscriptResult[];
}

interface VideoData {
  vidID: string;
  vidTitle: string;
  vidDescription: string;
  uploadDate: string;
  recordDate: string;
  location: string;
  transcript: string;
  englishTranslation: string;
  tags: string[];
  baseVideoURL: string;
  transcriptJson: TranscriptJson;
  englishTranscriptJson: TranscriptJson;
  transcriptEmbedding: number[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vidID = searchParams.get("vidID");

    if (!vidID) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 },
      );
    }

    const response = await client.get({
      index: "videos",
      id: vidID,
    });

    if (!response.found) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const videoData: VideoData = response._source as VideoData;
    return NextResponse.json(videoData);
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video data" },
      { status: 500 },
    );
  }
}
