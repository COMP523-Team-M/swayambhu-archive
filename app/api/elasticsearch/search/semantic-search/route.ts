import { NextRequest, NextResponse } from 'next/server';
import client from '../../../../../utils/elasticsearch';
import { generateEmbedding } from '../../../../../utils/generateEmbeddings';

interface VideoDocument {
  vidDescription: string;
  tags: string[];
  location?: string;
  transcript?: string;
  englishTranslation?: string;
  transcriptEmbedding?: number[];
}

interface SnippetDocument {
  transcriptSnippet: string;
  englishTranslation?: string;
  snippetEmbedding?: number[];
}

interface SearchFilters {
  uploadDate?: string;
  location?: string;
  tags?: string[];
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
    _source?: {
      excludes?: string[];
    } | undefined;
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
  { filters = {}, from = 0, size = 10 }: SearchOptions
) {
  try {
    const { uploadDate, location, tags } = filters;
    
    const searchQuery: ElasticsearchQuery = {
      index: 'videos',
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
                    params: { query_vector: queryEmbedding }
                  }
                }
              },
              {
                multi_match: {
                  query: originalQuery,
                  fields: [
                    'transcript',
                    'englishTranslation',
                    'vidDescription'
                  ],
                  type: 'most_fields',
                  boost: 0.2
                }
              }
            ],
            filter: []
          }
        },
        from,
        size,
        _source: {
          excludes: ['transcriptJson.alternatives.words', 'englishTranscriptJson.alternatives.words']
        }
      }
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

    searchQuery.body.query.bool.filter = filterArray;

    const response = await client.search(searchQuery) as ElasticsearchResponse;
    return response.hits.hits.map((hit: ElasticsearchHit) => ({
      ...hit._source,
      score: hit._score,
    }));
  } catch (error) {
    console.error('Error performing semantic search on videos:', error);
    throw error;
  }
}

export async function semanticSearchSnippets(
  queryEmbedding: number[],
  originalQuery: string,
  { from = 0, size = 10 }: Omit<SearchOptions, 'filters'>
) {
  try {
    const searchQuery: ElasticsearchQuery = {
      index: 'video_snippets',
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
                      double normalizedScore = 1.0 / (1.0 + Math.exp(-10.0 * (similarity - 0.5)));
                      return normalizedScore * 0.7;
                    `,
                    params: { query_vector: queryEmbedding }
                  }
                }
              },
              {
                multi_match: {
                  query: originalQuery,
                  fields: ['transcriptSnippet^2', 'englishTranslation'],
                  type: 'best_fields',
                  boost: 0.3
                }
              }
            ]
          }
        },
        from,
        size
      }
    };

    const response = await client.search(searchQuery) as ElasticsearchResponse;
    return response.hits.hits.map((hit: ElasticsearchHit) => ({
      ...hit._source,
      score: hit._score,
    }));
  } catch (error) {
    console.error('Error performing semantic search on snippets:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const type = searchParams.get('type');
  const from = parseInt(searchParams.get('from') || '0');
  const size = parseInt(searchParams.get('size') || '10');
  const uploadDate = searchParams.get('uploadDate');
  const location = searchParams.get('location');
  const tags = searchParams.get('tags');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 }
    );
  }

  try {
    const queryEmbedding = await generateEmbedding(query);
    
    const filters: SearchFilters = {};
    if (uploadDate) filters.uploadDate = uploadDate;
    if (location) filters.location = location;
    if (tags) filters.tags = tags.split(',');

    const results = type === 'snippet'
      ? await semanticSearchSnippets(queryEmbedding, query, { from, size })
      : await semanticSearchVideos(queryEmbedding, query, { filters, from, size });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error during semantic search:', error);
    return NextResponse.json(
      { error: 'Semantic search failed' },
      { status: 500 }
    );
  }
}