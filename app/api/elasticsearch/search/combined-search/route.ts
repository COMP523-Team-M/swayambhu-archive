import { NextRequest, NextResponse } from 'next/server';
import client from '../../../../../utils/elasticsearch';
import { generateEmbedding } from '../../../../../utils/generateEmbeddings';

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
        filter: any[];
        minimum_should_match?: number;
      };
    };
    from: number;
    size: number;
    _source?: {
      excludes?: string[];
    } | undefined;
  };
}

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

export async function combinedSearch(
  keywords: string[],
  queryEmbedding: number[],
  index: 'videos' | 'video_snippets',
  { filters = {}, from = 0, size = 10 }: SearchOptions
) {
  try {
    console.log('\n=== Combined Search Debug ===');
    console.log('Input params:', {
      keywords,
      index,
      filters,
      hasEmbedding: !!queryEmbedding,
      embeddingLength: queryEmbedding?.length
    });

    const { uploadDate, location, tags } = filters;
    const embeddingField = index === 'videos' ? 'transcriptEmbedding' : 'snippetEmbedding';
    
    const combinedQuery: ElasticsearchQuery = {
      index,
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: keywords.join(' '),
                  fields: index === 'videos' 
                    ? ['vidDescription^2', 'tags^1.5', 'location', 'transcript', 'englishTranslation'] 
                    : ['transcriptSnippet', 'englishTranslation'],
                  fuzziness: 'AUTO',
                  type: 'best_fields',
                  boost: 0.2
                }
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
                    params: { query_vector: queryEmbedding }
                  }
                }
              }
            ],
            filter: [],
            minimum_should_match: 1
          }
        },
        from,
        size,
        _source: index === 'videos' ? {
          excludes: ['transcriptJson.alternatives.words', 'englishTranscriptJson.alternatives.words']
        } : undefined
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

    combinedQuery.body.query.bool.filter = filterArray;

    const response = await client.search(combinedQuery) as ElasticsearchResponse;

    return response.hits.hits.map((hit: ElasticsearchHit) => {
      return {
        score: hit._score,
        ...hit._source
      };
    });
  } catch (error) {
    console.error('\nCombined search error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const index = searchParams.get('index') as 'videos' | 'video_snippets';
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

  if (!index || !['videos', 'video_snippets'].includes(index)) {
    return NextResponse.json(
      { error: "Invalid or missing 'index' parameter (must be 'videos' or 'video_snippets')" },
      { status: 400 }
    );
  }

  try {
    const queryEmbedding = await generateEmbedding(query);
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    const filters: SearchFilters = {};
    if (uploadDate) filters.uploadDate = uploadDate;
    if (location) filters.location = location;
    if (tags) filters.tags = tags.split(',');

    const results = await combinedSearch(
      keywords,
      queryEmbedding,
      index,
      { filters, from, size }
    );
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error during combined search:', error);
    return NextResponse.json(
      { error: 'Combined search failed' },
      { status: 500 }
    );
  }
}