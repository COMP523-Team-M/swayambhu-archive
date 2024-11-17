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
    const { uploadDate, location, tags } = filters;
    
    const combinedQuery = {
      index,
      body: {
        query: {
          bool: {
            should: [
              // Multi-match for metadata fields using extracted keywords
              {
                multi_match: {
                  query: keywords.join(' '), // Join keywords array into space-separated string
                  fields: index === 'videos' 
                    ? ['vidDescription^2', 'tags^1.5', 'location'] 
                    : ['transcriptSnippet'],
                  fuzziness: 'AUTO',
                  type: 'best_fields',
                },
              },
              // Semantic search using embeddings
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: "cosineSimilarity(params.query_vector, doc['transcriptEmbedding']) + 1.0",
                    params: { query_vector: queryEmbedding },
                  },
                },
              },
            ],
            filter: [], // Filters will be added dynamically
            minimum_should_match: 1,
          },
        },
        from,
        size,
      },
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

    const response = await client.search(combinedQuery);

    return response.hits.hits.map((hit) => ({
      ...hit._source,
      score: hit._score,
    }));
  } catch (error) {
    console.error('Error performing combined search:', error);
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
        ...(tags && { tags: tags.split(',') }), // Assume tags come as comma-separated string
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

// Summary of Return Values for Combined Search Functions
/**
 * The `combinedSearch` function returns an array of objects that match the combined search criteria.
 * Each object includes all fields from the corresponding document in the specified index (either 'videos' or 'video_snippets'), such as:
 * - title: The title of the video or snippet
 * - description: A description of the video content or snippet text
 * - tags: Any tags associated with the video or snippet
 * - uploadDate: The date the video was uploaded (if applicable)
 * - baseVideoURL: The URL to access the video (if applicable)
 * - snippetURL: The URL to access the snippet (if applicable)
 * - score: The relevance score indicating how well the result matches the search criteria
 * 
 * The API handler returns the results of the combined search as a JSON response.
 */