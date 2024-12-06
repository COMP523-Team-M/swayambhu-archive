import { combinedSearch } from "@/app/api/elasticsearch/search/combined-search/route";
import client from "@/utils-ts/elasticsearch";

jest.mock("@/utils-ts/elasticsearch", () => ({
  search: jest.fn(),
  get: jest.fn(),
}));

jest.mock("@/utils-ts/generateEmbeddings", () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(3072).fill(0.1)),
}));

describe("Combined Search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should combine keyword and semantic search results", async () => {
    (client.search as jest.Mock).mockResolvedValueOnce({
      hits: {
        hits: [
          {
            _source: {
              vidTitle: "Temple Architecture",
              vidDescription: "Analysis of temple structures",
              tags: ["temple", "architecture"],
              score: 0.95,
            },
            _score: 0.95,
          },
        ],
      },
    });

    const keywords = ["temple", "architecture"];
    const queryEmbedding = new Array(3072).fill(0.1);
    const index = "videos";

    const results = await combinedSearch(keywords, queryEmbedding, index, {});

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
});
