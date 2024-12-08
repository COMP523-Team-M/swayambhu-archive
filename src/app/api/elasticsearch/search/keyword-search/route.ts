/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { SearchFilters } from "@/app/api/interfaces";
import { searchSnippets, searchVideos } from "../functions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const type = searchParams.get("type") || "video";
  const from = parseInt(searchParams.get("from") || "0");
  const size = parseInt(searchParams.get("size") || "10");
  const uploadDate = searchParams.get("uploadDate");
  const location = searchParams.get("location");
  const tags = searchParams.get("tags");
  const vidID = searchParams.get("vidID");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 },
    );
  }

  try {
    const keywords = query
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 2);
    console.log(`keywords ->:`, keywords);

    const filters: SearchFilters = {};
    if (uploadDate) filters.uploadDate = uploadDate;
    if (location) filters.location = location;
    if (tags) filters.tags = tags.split(",");
    if (vidID) filters.vidID = vidID;

    const results =
      type === "snippet"
        ? await searchSnippets({
            keywords,
            filters,
            from,
            size,
          })
        : await searchVideos({
            keywords,
            filters,
            from,
            size,
          });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error during keyword search:", error);
    return NextResponse.json(
      { error: "Keyword search failed" },
      { status: 500 },
    );
  }
}
