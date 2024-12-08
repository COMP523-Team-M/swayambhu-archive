/* eslint-disable @typescript-eslint/no-explicit-any */
import client from "@/utils-ts/elasticsearch";
import {
  SearchOptions,
  ElasticsearchResponse,
  ElasticsearchHit,
  SearchParams,
  ElasticsearchQueryCombined,
  ElasticsearchQuery,
} from "../../interfaces";

export async function combinedSearch(
  keywords: string[],
  queryEmbedding: number[],
  index: "videos" | "video_snippets",
  { filters = {}, from = 0, size = 10 }: SearchOptions,
) {
  try {
    console.log("\n=== Combined Search Debug ===");
    console.log("Input params:", {
      keywords,
      index,
      filters,
      hasEmbedding: !!queryEmbedding,
      embeddingLength: queryEmbedding?.length,
    });

    const { uploadDate, location, tags, vidID } = filters;
    const embeddingField =
      index === "videos" ? "transcriptEmbedding" : "snippetEmbedding";

    const combinedQuery: ElasticsearchQueryCombined = {
      index,
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: keywords.join(" "),
                  fields:
                    index === "videos"
                      ? [
                          "vidTitle^3",
                          "vidDescription^2",
                          "tags^1.5",
                          "location",
                          "transcript",
                          "englishTranslation",
                        ]
                      : ["transcriptSnippet", "englishTranslation"],
                  fuzziness: "AUTO",
                  type: "best_fields",
                  boost: 0.2,
                },
              },
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: `
                        double similarity = cosineSimilarity(params.query_vector, '${embeddingField}');
                        double normalizedScore = 1.0 / (1.0 + Math.exp(-12.0 * (similarity - 0.55)));
                        return normalizedScore * 0.8;
                      `,
                    params: { query_vector: queryEmbedding },
                  },
                },
              },
            ],
            filter: [],
            minimum_should_match: 1,
          },
        },
        from,
        size,
        _source:
          index === "videos"
            ? {
                excludes: [
                  "transcriptJson.alternatives.words",
                  "englishTranscriptJson.alternatives.words",
                ],
              }
            : undefined,
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
      filterArray.push({ term: { vidID } }); // Added this - works for both videos and snippets
    }

    combinedQuery.body.query.bool.filter = filterArray;

    console.log(
      "Executing combined search with query:",
      JSON.stringify(combinedQuery, null, 2),
    );

    const response = (await client.search(
      combinedQuery,
    )) as ElasticsearchResponse;

    return response.hits.hits.map((hit: ElasticsearchHit) => ({
      score: hit._score,
      ...hit._source,
    }));
  } catch (error) {
    console.error("\nCombined search error:", error);
    throw error;
  }
}

function determineSearchField(keywords: string | string[]): string {
  const nepaliPattern = /[ऀ-ॿ]/;
  const keywordString = Array.isArray(keywords) ? keywords.join(" ") : keywords;
  return nepaliPattern.test(keywordString)
    ? "transcript"
    : "englishTranslation";
}

export async function searchVideos({
  keywords,
  filters = {},
  from = 0,
  size = 10,
}: SearchParams) {
  const { uploadDate, location, tags, vidID } = filters;
  const searchField = determineSearchField(keywords);
  const keywordString = Array.isArray(keywords) ? keywords.join(" ") : keywords;
  console.log(`keywordString ->:`, keywordString);

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

  const videoSearchQuery: ElasticsearchQuery = {
    index: "videos",
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: keywordString,
                fields: [
                  "vidTitle^3",
                  "vidDescription^2",
                  "tags^1.5",
                  searchField,
                ],
                type: "best_fields",
                fuzziness: "AUTO",
              },
            },
          ],
          filter: filterArray,
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

  const response = (await client.search(
    videoSearchQuery,
  )) as ElasticsearchResponse;
  return response.hits.hits.map((hit: ElasticsearchHit) => ({
    ...hit._source,
    score: hit._score,
  }));
}

export async function searchSnippets({
  keywords,
  filters = {},
  from = 0,
  size = 10,
}: SearchParams) {
  const searchField = determineSearchField(keywords);
  const keywordString = Array.isArray(keywords) ? keywords.join(" ") : keywords;
  const { vidID } = filters;

  const filterArray: any[] = [];
  if (vidID) {
    filterArray.push({ term: { vidID } });
  }

  const snippetSearchQuery: ElasticsearchQuery = {
    index: "video_snippets",
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: keywordString,
                fields: [searchField],
                type: "best_fields",
                fuzziness: "AUTO",
              },
            },
          ],
          filter: filterArray,
        },
      },
      from,
      size,
    },
  };

  const response = (await client.search(
    snippetSearchQuery,
  )) as ElasticsearchResponse;
  return response.hits.hits.map((hit: ElasticsearchHit) => ({
    ...hit._source,
    score: hit._score,
  }));
}

export async function semanticSearchVideos(
  queryEmbedding: number[],
  originalQuery: string,
  { filters = {}, from = 0, size = 10 }: SearchOptions,
) {
  try {
    const { uploadDate, location, tags, vidID } = filters;

    const searchQuery: ElasticsearchQueryCombined = {
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

    const searchQuery: ElasticsearchQueryCombined = {
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
