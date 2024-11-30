import client from '../../../../utils/elasticsearch';
import { generateEmbedding } from '../../../../utils/generateEmbeddings';

/**
 * Perform semantic search on videos using embeddings
 * @param {Array} queryEmbedding - Vector embedding for semantic search
 * @param {string} originalQuery - Original search query text
 * @param {Object} options - Search options including filters and pagination
 * @param {Object} options.filters - Optional filters (uploadDate, location, tags)
 * @param {number} options.from - Starting point for pagination
 * @param {number} options.size - Number of results to return
 * @returns {Array} Search results
 */
export async function semanticSearchVideos(queryEmbedding, originalQuery, { filters = {}, from = 0, size = 10 }) {
  try {
    const { uploadDate, location, tags } = filters;
    
    const searchQuery = {
      index: 'videos',
      body: {
        query: {
          bool: {
            should: [
              // Primary: Semantic similarity with improved normalization
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: `
                      // Calculate base similarity
                      double similarity = cosineSimilarity(params.query_vector, 'transcriptEmbedding');
                      
                      // Improved sigmoid normalization for better semantic understanding
                      double normalizedScore = 1.0 / (1.0 + Math.exp(-12.0 * (similarity - 0.55)));
                      
                      return normalizedScore * 0.8;
                    `,
                    params: { query_vector: queryEmbedding }
                  }
                }
              },
              // Secondary: Basic text relevance
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

    // Only add filters if they're provided
    if (filters && Object.keys(filters).length > 0) {
      if (uploadDate && /^\d{4}-\d{2}-\d{2}$/.test(uploadDate)) {
        searchQuery.body.query.bool.filter.push({ term: { uploadDate } });
      }
      if (location) {
        searchQuery.body.query.bool.filter.push({ match: { location } });
      }
      if (tags && tags.length > 0) {
        searchQuery.body.query.bool.filter.push({ terms: { tags } });
      }
    }

    const response = await client.search(searchQuery);
    return response.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score,
    }));
  } catch (error) {
    console.error('Error performing semantic search on videos:', error);
    throw error;
  }
}

/**
 * Perform semantic search on video snippets using embeddings
 * @param {Array} queryEmbedding - Vector embedding for semantic search
 * @param {string} originalQuery - Original search query text
 * @param {Object} options - Search options including pagination
 * @param {number} options.from - Starting point for pagination
 * @param {number} options.size - Number of results to return
 * @returns {Array} Search results
 */
export async function semanticSearchSnippets(queryEmbedding, originalQuery, { from = 0, size = 10 }) {
  try {
    const searchQuery = {
      index: 'video_snippets',
      body: {
        query: {
          bool: {
            should: [
              // Semantic similarity with normalized scoring
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
              // Text-based relevance
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

    const response = await client.search(searchQuery);
    return response.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score,
    }));
  } catch (error) {
    console.error('Error performing semantic search on snippets:', error);
    throw error;
  }
}

/**
 * API Handler for direct semantic search testing
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query, type, from = 0, size = 10, uploadDate, location, tags } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Missing query in request' });
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);
      
      // Constructing filters object
      const filters = {
        ...(uploadDate && { uploadDate }),
        ...(location && { location }),
        ...(tags && { tags: tags.split(',') }),
      };

      // Executing search based on type
      const results = type === 'snippet'
        ? await semanticSearchSnippets(queryEmbedding, query, { from: Number(from), size: Number(size) })
        : await semanticSearchVideos(queryEmbedding, query, { 
            filters, 
            from: Number(from), 
            size: Number(size) 
          });

      res.status(200).json(results);
    } catch (error) {
      console.error('Error during semantic search:', error);
      res.status(500).json({ error: 'Semantic search failed' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
