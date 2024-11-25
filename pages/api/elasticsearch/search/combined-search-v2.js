import client from '../../../../utils/elasticsearch';
import { generateEmbedding } from '../../../../utils/generateEmbeddings';

/**
 * Perform a combined search: semantic search and multi-match search.
 * @param {Array} keywords - Array of extracted keywords from the query
 * @param {Array} queryEmbedding - Vector embedding for semantic search
 * @param {string} index - Elasticsearch index to query ('videos' or 'video_snippets')
 * @param {Object} options - Search options including filters and pagination
 * @param {Object} options.filters - Optional filters (uploadDate, location, tags)
 * @param {number} options.from - Starting point for pagination
 * @param {number} options.size - Number of results to return
 * @returns {Array} Combined search results
 */
export async function combinedSearch(keywords, queryEmbedding, index, { filters = {}, from = 0, size = 10 }) {
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
    
    const combinedQuery = {
      index,
      body: {
        query: {
          bool: {
            should: [
              // Multi-match for metadata fields using extracted keywords
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
              // Semantic search using embeddings with improved normalization
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

    // Adding filters dynamically if they are provided
    if (uploadDate && /^\d{4}-\d{2}-\d{2}$/.test(uploadDate)) {
      combinedQuery.body.query.bool.filter.push({ term: { uploadDate } });
    }
    if (location) {
      combinedQuery.body.query.bool.filter.push({ match: { location } });
    }
    if (tags && tags.length > 0) {
      combinedQuery.body.query.bool.filter.push({ terms: { tags } });
    }

    console.log('\nConstructed Query:', {
      index,
      searchFields: index === 'videos' 
        ? ['vidDescription', 'tags', 'location', 'transcript', 'englishTranslation']
        : ['transcriptSnippet', 'englishTranslation'],
      filterCount: combinedQuery.body.query.bool.filter.length,
      hasEmbeddingSearch: true
    });

    const response = await client.search(combinedQuery);
    console.log('\nSearch Results:', {
      total: response.hits.total,
      maxScore: response.hits.max_score,
      hits: response.hits.hits.length
    });

    return response.hits.hits.map((hit) => ({
      ...hit._source,
      score: hit._score,
    }));
  } catch (error) {
    console.error('\nCombined search error:', error);
    throw error;
  }
}

/**
 * API Handler for direct combined search testing
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { 
      query, 
      index,
      from = 0,
      size = 10,
      uploadDate,
      location,
      tags 
    } = req.query;

    // Validating input
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }
    if (!index || !['videos', 'video_snippets'].includes(index)) {
      return res.status(400).json({ error: "Invalid or missing 'index' parameter (must be 'videos' or 'video_snippets')" });
    }

    try {
      // For direct testing, generate both keywords and embeddings
      const queryEmbedding = await generateEmbedding(query);
      // Simple keyword extraction for testing (in production this would come from analyzeQuery)
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      
      // Constructing filters object
      const filters = {
        ...(uploadDate && { uploadDate }),
        ...(location && { location }),
        ...(tags && { tags: tags.split(',') }),
      };

      const results = await combinedSearch(
        keywords,
        queryEmbedding,
        index,
        { filters, from: Number(from), size: Number(size) }
      );
      
      res.status(200).json(results);
    } catch (error) {
      console.error('Error during combined search:', error);
      res.status(500).json({ error: 'Combined search failed' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
