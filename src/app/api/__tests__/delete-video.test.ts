import { DELETE } from "@/app/api/elasticsearch/CRUD/delete-video/route";
import client from "@/utils-ts/elasticsearch";

jest.mock("@/utils-ts/elasticsearch", () => ({
  delete: jest.fn(),
  deleteByQuery: jest.fn(),
}));

describe("DELETE /api/delete-video", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully delete a video and its snippets", async () => {
    (client.delete as jest.Mock).mockResolvedValueOnce({ result: "deleted" });
    (client.deleteByQuery as jest.Mock).mockResolvedValueOnce({ deleted: 5 });

    const url = new URL("http://localhost:3000/api/delete-video");
    url.searchParams.set("vidID", "test-video-123");

    const response = await DELETE(new Request(url));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe(
      "Video and associated snippets deleted successfully",
    );

    expect(client.delete).toHaveBeenCalledWith({
      index: "videos",
      id: "test-video-123",
    });

    expect(client.deleteByQuery).toHaveBeenCalledWith({
      index: "video_snippets",
      body: {
        query: {
          match: { vidID: "test-video-123" },
        },
      },
    });
  });

  it("should handle missing video ID", async () => {
    const url = new URL("http://localhost:3000/api/delete-video");
    const response = await DELETE(new Request(url));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Video ID is required");
  });

  it("should handle elasticsearch errors", async () => {
    (client.delete as jest.Mock).mockRejectedValueOnce(
      new Error("Elasticsearch error"),
    );

    const url = new URL("http://localhost:3000/api/delete-video");
    url.searchParams.set("vidID", "test-video-123");

    const response = await DELETE(new Request(url));

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe("Failed to delete video and snippets");
  });

  it("should handle snippet deletion errors", async () => {
    (client.delete as jest.Mock).mockResolvedValueOnce({ result: "deleted" });
    (client.deleteByQuery as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to delete snippets"),
    );

    const url = new URL("http://localhost:3000/api/delete-video");
    url.searchParams.set("vidID", "test-video-123");

    const response = await DELETE(new Request(url));

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe("Failed to delete video and snippets");
  });
});
