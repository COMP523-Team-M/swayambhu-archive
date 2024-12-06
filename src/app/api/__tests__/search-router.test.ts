import dotenv from "dotenv";
dotenv.config();

import { GET } from "@/app/api/search-router/route";
import { analyzeQuery } from "@/utils-ts/analyzeQuery";
import { searchVideos } from "@/app/api/elasticsearch/search/keyword-search/route";
import { semanticSearchVideos } from "@/app/api/elasticsearch/search/semantic-search/route";
import { NextRequest } from "next/server";

console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "exists" : "not found",
);

jest.mock("@/utils-ts/analyzeQuery", () => ({
  analyzeQuery: jest.fn(),
}));
jest.mock("@/utils-ts/elasticsearch");
jest.mock("@/app/api/elasticsearch/search/keyword-search/route");
jest.mock("@/app/api/elasticsearch/search/semantic-search/route");
jest.mock("@/app/api/elasticsearch/search/combined-search/route");
jest.mock("@/utils-ts/generateEmbeddings", () => ({
  generateEmbedding: jest.fn(),
}));

describe("Search Router", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle basic keyword search for videos", async () => {
    (analyzeQuery as jest.Mock).mockResolvedValueOnce({
      searchType: "keyword",
      level: "video",
      keywords: ["temple", "history"],
      filters: {},
    });

    (searchVideos as jest.Mock).mockResolvedValueOnce([
      {
        vidTitle: "Temple History",
        vidDescription: "A video about temples",
        tags: ["temple", "history"],
        score: 0.8,
      },
    ]);

    const request = new NextRequest(
      new URL("http://localhost:3000/api/search?query=temple+history"),
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.metadata).toEqual({
      searchType: "keyword",
      level: "video",
      totalResults: 1,
      page: 1,
      pageSize: 10,
    });
    expect(data.results[0]).toHaveProperty("vidTitle", "Temple History");
    expect(data.results[0].type).toBe("video");
  });

  it("should handle missing query parameter", async () => {
    const request = new NextRequest(
      new URL("http://localhost:3000/api/search"),
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing query parameter");
  });

  it("should handle page size limits", async () => {
    const request = new NextRequest(
      new URL("http://localhost:3000/api/search?query=temple&size=100"),
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Maximum page size is 50");
  });

  it("should handle semantic search for videos", async () => {
    (analyzeQuery as jest.Mock).mockResolvedValueOnce({
      searchType: "semantic",
      level: "video",
      queryEmbedding: new Array(3072).fill(0.1),
      filters: {},
    });

    (semanticSearchVideos as jest.Mock).mockResolvedValueOnce([
      {
        vidTitle: "Temple Architecture",
        vidDescription: "Detailed analysis of temple structures",
        tags: ["architecture", "temple"],
        score: 0.9,
      },
    ]);

    const request = new NextRequest(
      new URL(
        "http://localhost:3000/api/search?query=temple+architecture+analysis",
      ),
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.metadata.searchType).toBe("semantic");
    expect(data.results[0]).toHaveProperty("vidTitle", "Temple Architecture");
  });
});
