/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/utils-ts/generateEmbeddings";
import { combinedSearch } from "../functions";
import { SearchFilters } from "@/app/api/interfaces";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const index = searchParams.get("index") as "videos" | "video_snippets";
  const from = parseInt(searchParams.get("from") || "0");
  const size = parseInt(searchParams.get("size") || "10");
  const uploadDate = searchParams.get("uploadDate");
  const location = searchParams.get("location");
  const tags = searchParams.get("tags");
  const vidID = searchParams.get("vidID"); // Added this

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 },
    );
  }

  if (!index || !["videos", "video_snippets"].includes(index)) {
    return NextResponse.json(
      {
        error:
          "Invalid or missing 'index' parameter (must be 'videos' or 'video_snippets')",
      },
      { status: 400 },
    );
  }

  try {
    const queryEmbedding = await generateEmbedding(query);
    const keywords = query
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 2);

    const filters: SearchFilters = {};
    if (uploadDate) filters.uploadDate = uploadDate;
    if (location) filters.location = location;
    if (tags) filters.tags = tags.split(",");
    if (vidID) filters.vidID = vidID; // Added this

    const results = await combinedSearch(keywords, queryEmbedding, index, {
      filters,
      from,
      size,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error during combined search:", error);
    return NextResponse.json(
      { error: "Combined search failed" },
      { status: 500 },
    );
  }
}
