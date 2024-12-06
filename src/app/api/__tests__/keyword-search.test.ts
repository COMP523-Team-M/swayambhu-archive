import { GET } from "@/app/api/elasticsearch/search/keyword-search/route";
import client from "@/utils-ts/elasticsearch";
import { NextRequest } from "next/server";

jest.mock("@/utils-ts/elasticsearch", () => ({
  search: jest.fn(),
}));

describe("Keyword Search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should perform video-level search successfully", async () => {
    const mockResponse = {
      hits: {
        hits: [
          {
            _source: {
              vidID: "test-123",
              vidTitle: "Temple History",
              vidDescription: "A video about temple history",
              transcript: "यो मन्दिर इतिहास हो",
              englishTranslation: "This is temple history",
              tags: ["temple", "history"],
              location: "Nepal",
            },
            _score: 1.5,
          },
        ],
        total: { value: 1 },
      },
    };

    (client.search as jest.Mock).mockResolvedValueOnce(mockResponse);

    const url = new URL("http://localhost:3000/api/keyword-search");
    url.searchParams.set("query", "temple history");
    url.searchParams.set("type", "video");
    url.searchParams.set("location", "Nepal");

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data[0].vidTitle).toBe("Temple History");

    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({
        index: "videos",
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  multi_match: expect.objectContaining({
                    fields: [
                      "vidTitle^3",
                      "vidDescription^2",
                      "tags^1.5",
                      "englishTranslation",
                    ],
                  }),
                }),
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("should perform snippet-level search successfully", async () => {
    const mockResponse = {
      hits: {
        hits: [
          {
            _source: {
              transcriptSnippet: "A snippet about temple history",
              englishTranslation: "English translation of temple history",
              vidID: "test-123",
            },
            _score: 1.5,
          },
        ],
        total: { value: 1 },
      },
    };

    (client.search as jest.Mock).mockResolvedValueOnce(mockResponse);

    const url = new URL("http://localhost:3000/api/keyword-search");
    url.searchParams.set("query", "temple history");
    url.searchParams.set("type", "snippet");

    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data[0].transcriptSnippet).toBe("A snippet about temple history");
  });

  it("should handle Nepali text search correctly", async () => {
    const mockResponse = {
      hits: { hits: [] },
    };

    (client.search as jest.Mock).mockResolvedValueOnce(mockResponse);

    const url = new URL("http://localhost:3000/api/keyword-search");
    url.searchParams.set("query", "मन्दिर इतिहास");

    const request = new NextRequest(url);
    await GET(request);

    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  multi_match: expect.objectContaining({
                    fields: expect.arrayContaining(["transcript"]),
                  }),
                }),
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("should handle missing query parameter", async () => {
    const url = new URL("http://localhost:3000/api/keyword-search");
    const request = new NextRequest(url);

    const response = await GET(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Missing query parameter");
  });

  it("should apply multiple filters correctly", async () => {
    const mockResponse = {
      hits: { hits: [] },
    };

    (client.search as jest.Mock).mockResolvedValueOnce(mockResponse);

    const url = new URL("http://localhost:3000/api/keyword-search");
    url.searchParams.set("query", "temple");
    url.searchParams.set("location", "Nepal");
    url.searchParams.set("tags", "history,culture");
    url.searchParams.set("uploadDate", "2024-03-19");

    const request = new NextRequest(url);
    await GET(request);

    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { match: { location: "Nepal" } },
                { terms: { tags: ["history", "culture"] } },
                { term: { uploadDate: "2024-03-19" } },
              ]),
            }),
          }),
        }),
      }),
    );
  });

  it("should handle elasticsearch errors", async () => {
    (client.search as jest.Mock).mockRejectedValueOnce(
      new Error("Elasticsearch error"),
    );

    const url = new URL("http://localhost:3000/api/keyword-search");
    url.searchParams.set("query", "temple");
    const request = new NextRequest(url);

    const response = await GET(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBe("Keyword search failed");
  });
});
