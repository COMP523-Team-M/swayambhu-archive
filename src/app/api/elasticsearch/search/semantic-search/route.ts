/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import client from "@/utils-ts/elasticsearch";
import { generateEmbedding } from "@/utils-ts/generateEmbeddings";

interface VideoDocument {
  vidTitle: string;
  vidDescription: string;
  tags: string[];
  location?: string;
  transcript?: string;
  englishTranslation?: string;
  transcriptEmbedding?: number[];
  vidID: string; // Added this
}

interface SnippetDocument {
  transcriptSnippet: string;
  englishTranslation?: string;
  snippetEmbedding?: number[];
  vidID: string; // Added this
}

interface SearchFilters {
  uploadDate?: string;
  location?: string;
  tags?: string[];
  vidID?: string; // Added this
}

interface SearchOptions {
  filters?: SearchFilters;
  from?: number;
  size?: number;
}

interface ElasticsearchQuery {
  index: string;
  body: {
    query: {
      bool: {
        should: any[];
        filter?: any[];
      };
    };
    from: number;
    size: number;
    _source?:
      | {
          excludes?: string[];
        }
      | undefined;
  };
}

interface ElasticsearchHit {
  _source: VideoDocument | SnippetDocument;
  _score: number;
}

interface ElasticsearchResponse {
  hits: {
    hits: ElasticsearchHit[];
    total: number;
    max_score: number;
  };
}

export async function semanticSearchVideos(
  queryEmbedding: number[],
  originalQuery: string,
  { filters = {}, from = 0, size = 10 }: SearchOptions,
) {
  try {
    const { uploadDate, location, tags, vidID } = filters;

    const searchQuery: ElasticsearchQuery = {
      index: "videos",
      body: {
        query: {
          bool: {
            should: [
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: `
                      double similarity = cosineSimilarity(params.query_vector, 'transcriptEmbedding');
                      double normalizedScore = 1.0 / (1.0 + Math.exp(-12.0 * (similarity - 0.55)));
                      return normalizedScore * 0.8;
                    `,
                    params: { query_vector: queryEmbedding },
                  },
                },
              },
              {
                multi_match: {
                  query: originalQuery,
                  fields: [
                    "vidTitle^3",
                    "transcript",
                    "englishTranslation",
                    "vidDescription",
                  ],
                  type: "most_fields",
                  boost: 0.2,
                },
              },
            ],
            filter: [],
          },
        },
        from,
        size,
        _source: {
          excludes: [
            "transcriptJson.alternatives.words",
            "englishTranscriptJson.alternatives.words",
          ],
        },
      },
    };

    const filterArray: any[] = [];

    if (uploadDate && /^\d{4}-\d{2}-\d{2}$/.test(uploadDate)) {
      filterArray.push({ term: { uploadDate } });
    }
    if (location) {
      filterArray.push({ match: { location } });
    }
    if (tags && tags.length > 0) {
      filterArray.push({ terms: { tags } });
    }
    if (vidID) {
      filterArray.push({ term: { vidID } }); // Added this
    }

    searchQuery.body.query.bool.filter = filterArray;

    const response = (await client.search(
      searchQuery,
    )) as ElasticsearchResponse;
    return response.hits.hits.map((hit: ElasticsearchHit) => ({
      score: hit._score,
      ...hit._source,
    }));
  } catch (error) {
    console.error("Error during semantic video search:", error);
    throw error;
  }
}

export async function semanticSearchSnippets(
  queryEmbedding: number[],
  originalQuery: string,
  { filters = {}, from = 0, size = 10 }: SearchOptions, // Added filters parameter
) {
  try {
    const { vidID } = filters; // Added this

    const searchQuery: ElasticsearchQuery = {
      index: "video_snippets",
      body: {
        query: {
          bool: {
            should: [
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: `
                      double similarity = cosineSimilarity(params.query_vector, 'snippetEmbedding');
                      double normalizedScore = 1.0 / (1.0 + Math.exp(-12.0 * (similarity - 0.55)));
                      return normalizedScore * 0.8;
                    `,
                    params: { query_vector: queryEmbedding },
                  },
                },
              },
              {
                multi_match: {
                  query: originalQuery,
                  fields: ["transcriptSnippet", "englishTranslation"],
                  type: "most_fields",
                  boost: 0.2,
                },
              },
            ],
            filter: [], // Initialize filter array
          },
        },
        from,
        size,
      },
    };

    // Add vidID filter if provided
    if (vidID) {
      searchQuery.body.query.bool.filter = [{ term: { vidID } }]; // Added this
    }

    const response = (await client.search(
      searchQuery,
    )) as ElasticsearchResponse;
    return response.hits.hits.map((hit: ElasticsearchHit) => ({
      score: hit._score,
      ...hit._source,
    }));
  } catch (error) {
    console.error("Error during semantic snippet search:", error);
    throw error;
  }
}

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
