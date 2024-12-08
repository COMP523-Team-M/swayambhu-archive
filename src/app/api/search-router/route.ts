/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { analyzeQuery } from "@/utils-ts/analyzeQuery";
import client from "@/utils-ts/elasticsearch";
import {
  searchVideos,
  searchSnippets,
  semanticSearchVideos,
  semanticSearchSnippets,
  combinedSearch,
} from "../elasticsearch/search/functions";

// Base interface for shared properties
interface BaseDocument {
  score: number;
  englishTranslation?: string;
}

interface VideoDocument extends BaseDocument {
  type: "video";
  vidTitle: string;
  vidDescription: string;
  tags: string[];
  location?: string;
  transcript?: string;
  transcriptEmbedding?: number[];
  transcriptJson?: any;
  englishTranscriptJson?: any;
}

interface SnippetDocument extends BaseDocument {
  type: "snippet";
  transcriptSnippet: string;
  snippetEmbedding?: number[];
  vidID: string;
}

type SearchResult = VideoDocument | SnippetDocument;

interface SearchMetadata {
  searchType: "keyword" | "semantic" | "combined";
  level: "video" | "snippet";
  totalResults: number;
  page: number;
  pageSize: number;
}

interface SearchResponse {
  results: any[];
  metadata: SearchMetadata;
}

interface QueryAnalysis {
  searchType: "keyword" | "semantic" | "combined";
  level: "video" | "snippet";
  filters?: {
    uploadDate?: string;
    location?: string;
    tags?: string[];
    vidID?: string;
  };
  keywords?: string[];
  queryEmbedding?: number[];
}

interface ElasticsearchGetResponse {
  _source: VideoDocument;
}

// Helper function to add type discriminator to results
function addTypeToResults(
  results: any[],
  type: "video" | "snippet",
): SearchResult[] {
  return results.map((result) => ({
    ...result,
    type,
  })) as SearchResult[];
}

export async function GET(request: NextRequest) {
  console.log("\n=== Search Router Started ===");

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const from = parseInt(searchParams.get("from") || "0");
  const size = parseInt(searchParams.get("size") || "10");

  console.log("Query received:", { query, from, size });

  // Input validation
  if (!query) {
    console.log("Error: Missing query parameter");
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 },
    );
  }

  if (size > 50) {
    console.log("Error: Page size too large");
    return NextResponse.json(
      { error: "Maximum page size is 50" },
      { status: 400 },
    );
  }

  try {
    // Step 1: Analyze query
    console.log("\nAnalyzing query:", query);
    const analysis = (await analyzeQuery(query)) as QueryAnalysis;
    console.log("Analysis result:", {
      searchType: analysis.searchType,
      level: analysis.level,
      hasFilters: !!analysis.filters,
      hasKeywords: !!analysis.keywords,
      hasEmbedding: !!analysis.queryEmbedding,
    });

    if (!analysis || !analysis.searchType) {
      throw new Error("Invalid query analysis result");
    }

    // Step 2: Get search parameters
    const {
      searchType = "combined",
      level = "video",
      filters = {},
      keywords = [],
      queryEmbedding,
    } = analysis;

    const searchParams = { filters, from: Number(from), size: Number(size) };

    // Step 3: Route to appropriate search
    console.log("\nRouting to:", searchType, "search");
    let searchResults: SearchResult[];

    switch (searchType) {
      case "keyword":
        console.log("Executing keyword search with params:", {
          level,
          keywords: keywords.slice(0, 3),
          filters: Object.keys(filters),
        });
        const keywordResults =
          level === "video"
            ? await searchVideos({ keywords, ...searchParams })
            : await searchSnippets({ keywords, ...searchParams }); // Fixed: now passing searchParams with filters
        searchResults = addTypeToResults(
          keywordResults,
          level === "video" ? "video" : "snippet",
        );
        break;

      case "semantic":
        if (!queryEmbedding)
          throw new Error("Missing query embedding for semantic search");
        console.log("Executing semantic search with params:", {
          level,
          queryLength: queryEmbedding?.length,
          filters: Object.keys(filters),
        });
        const semanticResults =
          level === "video"
            ? await semanticSearchVideos(queryEmbedding, query, searchParams)
            : await semanticSearchSnippets(queryEmbedding, query, searchParams);
        searchResults = addTypeToResults(
          semanticResults,
          level === "video" ? "video" : "snippet",
        );
        break;

      case "combined":
      default:
        if (!queryEmbedding)
          throw new Error("Missing query embedding for combined search");
        console.log("\n=== Combined Search Debug (Router) ===");
        console.log("Pre-search params:", {
          level,
          keywords: keywords.slice(0, 3),
          hasEmbedding: !!queryEmbedding,
          filters: Object.keys(filters),
          searchParams,
        });

        const index = level === "video" ? "videos" : "video_snippets";
        const combinedResults = await combinedSearch(
          keywords,
          queryEmbedding,
          index,
          searchParams,
        );
        searchResults = addTypeToResults(
          combinedResults,
          level === "video" ? "video" : "snippet",
        );
        break;
    }

    console.log("\nSearch completed");
    console.log("Results found:", searchResults.length);

    // Strip out embeddings from results with type guard
    const cleanResults = searchResults.map((result: SearchResult) => {
      if (result.type === "snippet") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { snippetEmbedding, ...rest } = result;
        return rest;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { transcriptEmbedding, ...rest } = result;
        return rest;
      }
    });

    // If this was a snippet search, fetch the full video data for each result
    if (level === "snippet") {
      const enhancedResults = await Promise.all(
        cleanResults.map(async (snippet) => {
          if (snippet.type !== "snippet") {
            throw new Error("Invalid result type for snippet search");
          }

          const videoDoc = (await client.get({
            index: "videos",
            id: snippet.vidID,
          })) as ElasticsearchGetResponse;

          return {
            ...snippet,
            videoData: {
              transcriptJson: videoDoc._source.transcriptJson,
              englishTranscriptJson: videoDoc._source.englishTranscriptJson,
            },
          };
        }),
      );

      const response: SearchResponse = {
        results: enhancedResults,
        metadata: {
          searchType,
          level,
          totalResults: enhancedResults.length,
          page: Math.floor(from / size) + 1,
          pageSize: size,
        },
      };

      return NextResponse.json(response);
    }

    const response: SearchResponse = {
      results: cleanResults,
      metadata: {
        searchType,
        level,
        totalResults: cleanResults.length,
        page: Math.floor(from / size) + 1,
        pageSize: size,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("\nError in search router:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 },
    );
  }
}
