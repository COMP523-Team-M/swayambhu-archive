import { NextRequest, NextResponse } from "next/server";
import client from "@/utils-ts/elasticsearch";
import { VideoData } from "../../../interfaces";

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
