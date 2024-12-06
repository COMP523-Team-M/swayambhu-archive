import {
  semanticSearchVideos,
  semanticSearchSnippets,
} from "@/app/api/elasticsearch/search/semantic-search/route";
import client from "@/utils-ts/elasticsearch";

jest.mock("@/utils-ts/elasticsearch", () => ({
  search: jest.fn(),
  get: jest.fn(),
}));

jest.mock("@/utils-ts/generateEmbeddings", () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(3072).fill(0.1)),
}));

describe("Semantic Search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Video Search", () => {
    it("should perform semantic search on videos with vector similarity", async () => {
      (client.search as jest.Mock).mockResolvedValueOnce({
        hits: {
          hits: [
            {
              _source: {
                vidTitle: "Temple Architecture",
                vidDescription: "Deep analysis of temple structures",
                transcript: "Detailed discussion about temple architecture...",
                transcriptEmbedding: new Array(3072).fill(0.1),
                score: 0.95,
              },
              _score: 0.95,
            },
          ],
        },
      });

      const queryEmbedding = new Array(3072).fill(0.1);
      const originalQuery = "explain temple architecture in detail";

      const results = await semanticSearchVideos(
        queryEmbedding,
        originalQuery,
        {},
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty("vidTitle", "Temple Architecture");
      expect(client.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: "videos",
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                should: expect.arrayContaining([
                  expect.objectContaining({ script_score: expect.any(Object) }),
                  expect.objectContaining({ multi_match: expect.any(Object) }),
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it("should apply filters correctly", async () => {
      (client.search as jest.Mock).mockResolvedValueOnce({
        hits: { hits: [] },
      });

      const filters = {
        location: "Bangalore",
        tags: ["temple", "history"],
        uploadDate: "2024-03-20",
      };

      await semanticSearchVideos(
        new Array(3072).fill(0.1),
        "temple architecture",
        { filters },
      );

      expect(client.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  { match: { location: "Bangalore" } },
                  { terms: { tags: ["temple", "history"] } },
                  { term: { uploadDate: "2024-03-20" } },
                ]),
              }),
            }),
          }),
        }),
      );
    });
  });

  describe("Snippet Search", () => {
    it("should perform semantic search on snippets", async () => {
      (client.search as jest.Mock).mockResolvedValueOnce({
        hits: {
          hits: [
            {
              _source: {
                transcriptSnippet: "This part discusses temple architecture...",
                snippetEmbedding: new Array(3072).fill(0.1),
                vidID: "video123",
                score: 0.88,
              },
              _score: 0.88,
            },
          ],
        },
      });

      const queryEmbedding = new Array(3072).fill(0.1);
      const originalQuery = "temple architecture details";

      const results = await semanticSearchSnippets(
        queryEmbedding,
        originalQuery,
        {},
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty("transcriptSnippet");
      expect(results[0]).toHaveProperty("vidID", "video123");
      expect(client.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: "video_snippets",
        }),
      );
    });

    it("should handle errors gracefully", async () => {
      (client.search as jest.Mock).mockRejectedValueOnce(
        new Error("Elasticsearch error"),
      );

      const queryEmbedding = new Array(3072).fill(0.1);

      await expect(
        semanticSearchVideos(queryEmbedding, "test query", {}),
      ).rejects.toThrow("Elasticsearch error");
    });
  });

  it("should handle pagination correctly", async () => {
    (client.search as jest.Mock).mockResolvedValueOnce({
      hits: { hits: [] },
    });

    const from = 20;
    const size = 10;

    await semanticSearchVideos(new Array(3072).fill(0.1), "test query", {
      from,
      size,
    });

    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          from: 20,
          size: 10,
        }),
      }),
    );
  });
});
