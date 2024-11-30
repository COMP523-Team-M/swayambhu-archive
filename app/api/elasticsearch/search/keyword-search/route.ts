import { NextRequest, NextResponse } from 'next/server';
import client from '../../../../../utils/elasticsearch';

interface VideoDocument {
  vidTitle: string;
  vidDescription: string;
  tags: string[];
  location?: string;
  transcript?: string;
  englishTranslation?: string;
  vidID: string;
}

interface SnippetDocument {
  transcriptSnippet: string;
  englishTranslation?: string;
  vidID: string;  // Added this
}

interface SearchFilters {
  uploadDate?: string;
  location?: string;
  tags?: string[];
  vidID?: string;  // Added this
}

interface SearchParams {
  keywords: string | string[];
  filters?: SearchFilters;
  from?: number;
  size?: number;
}

interface ElasticsearchQuery {
  index: string;
  body: {
    query: {
      bool: {
        must: any[];
        filter: any[];
      };
      multi_match?: {
        query: string;
        fields: string[];
        type: string;
        fuzziness: string;
      };
    };
    from: number;
    size: number;
    _source?: {
      excludes?: string[];
    };
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

function determineSearchField(keywords: string | string[]): string {
  const nepaliPattern = /[ऀ-ॿ]/;
  const keywordString = Array.isArray(keywords) ? keywords.join(' ') : keywords;
  return nepaliPattern.test(keywordString) ? 'transcript' : 'englishTranslation';
}

export async function searchVideos({ 
  keywords, 
  filters = {}, 
  from = 0, 
  size = 10 
}: SearchParams) {
  const { uploadDate, location, tags, vidID } = filters;
  const searchField = determineSearchField(keywords);
  const keywordString = Array.isArray(keywords) ? keywords.join(' ') : keywords;

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
    filterArray.push({ term: { vidID } });  // Added this
  }

  const videoSearchQuery: ElasticsearchQuery = {
    index: 'videos',
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: keywordString,
                fields: ['vidTitle^3', 'vidDescription^2', 'tags^1.5', searchField],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: filterArray,
        },
      },
      from,
      size,
      _source: {
        excludes: ['transcriptJson.alternatives.words', 'englishTranscriptJson.alternatives.words']
      }
    },
  };

  const response = await client.search(videoSearchQuery) as ElasticsearchResponse;
  return response.hits.hits.map((hit: ElasticsearchHit) => ({
    ...hit._source,
    score: hit._score,
  }));
}

export async function searchSnippets({ 
  keywords, 
  filters = {}, // Added filters parameter
  from = 0, 
  size = 10 
}: SearchParams) {
  const searchField = determineSearchField(keywords);
  const keywordString = Array.isArray(keywords) ? keywords.join(' ') : keywords;
  const { vidID } = filters;  // Added this

  const filterArray: any[] = [];
  if (vidID) {
    filterArray.push({ term: { vidID } });  // Added this
  }

  const snippetSearchQuery: ElasticsearchQuery = {
    index: 'video_snippets',
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: keywordString,
                fields: [searchField],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: filterArray,  // Added this
        },
      },
      from,
      size,
    },
  };

  const response = await client.search(snippetSearchQuery) as ElasticsearchResponse;
  return response.hits.hits.map((hit: ElasticsearchHit) => ({
    ...hit._source,
    score: hit._score,
  }));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'video';
  const from = parseInt(searchParams.get('from') || '0');
  const size = parseInt(searchParams.get('size') || '10');
  const uploadDate = searchParams.get('uploadDate');
  const location = searchParams.get('location');
  const tags = searchParams.get('tags');
  const vidID = searchParams.get('vidID');

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 }
    );
  }

  try {
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    const filters: SearchFilters = {};
    if (uploadDate) filters.uploadDate = uploadDate;
    if (location) filters.location = location;
    if (tags) filters.tags = tags.split(',');
    if (vidID) filters.vidID = vidID;

    const results = type === 'snippet'
      ? await searchSnippets({ 
          keywords, 
          filters,  // Now passing filters to searchSnippets
          from, 
          size 
        })
      : await searchVideos({ 
          keywords, 
          filters, 
          from, 
          size 
        });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error during keyword search:', error);
    return NextResponse.json(
      { error: 'Keyword search failed' },
      { status: 500 }
    );
  }
}