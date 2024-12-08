/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/utils-ts/generateEmbeddings";
import { SearchFilters } from "@/app/api/interfaces";
import { semanticSearchSnippets, semanticSearchVideos } from "../functions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const type = searchParams.get("type") || "video";
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

  try {
    const queryEmbedding = await generateEmbedding(query);

    const filters: SearchFilters = {};
    if (uploadDate) filters.uploadDate = uploadDate;
    if (location) filters.location = location;
    if (tags) filters.tags = tags.split(",");
    if (vidID) filters.vidID = vidID; // Added this

    const results =
      type === "snippet"
        ? await semanticSearchSnippets(queryEmbedding, query, {
            filters,
            from,
            size,
          })
        : await semanticSearchVideos(queryEmbedding, query, {
            filters,
            from,
            size,
          });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error during semantic search:", error);
    return NextResponse.json(
      { error: "Semantic search failed" },
      { status: 500 },
    );
  }
}
