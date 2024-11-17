import client from '../../../../utils/elasticsearch';
import { generateEmbedding } from '../../../../utils/generateEmbeddings';

/**
 * Perform semantic search on videos using embeddings
 * @param {Array} queryEmbedding - Vector embedding for semantic search
 * @param {Object} options - Search options including filters and pagination
 * @param {Object} options.filters - Optional filters (uploadDate, location, tags)
 * @param {number} options.from - Starting point for pagination
 * @param {number} options.size - Number of results to return
 * @returns {Array} Search results
 */
export async function semanticSearchVideos(queryEmbedding, { filters = {}, from = 0, size = 10 }) {
  try {
    const { uploadDate, location, tags } = filters;
    
    const searchQuery = {
      index: 'videos',
      body: {
        query: {
          bool: {
            must: [{
              script_score: {
                query: { match_all: {} },
                script: {
                  source: "cosineSimilarity(params.query_vector, doc['transcriptEmbedding']) + 1.0",
                  params: { query_vector: queryEmbedding },
                },
              },
            }],
            filter: [], // Filters will be added dynamically
          }
        },
        from,
        size,
      },
    };

    // Adding filters dynamically
    if (uploadDate && /^\d{4}-\d{2}-\d{2}$/.test(uploadDate)) {
      searchQuery.body.query.bool.filter.push({ term: { uploadDate } });
    }
    if (location) {
      searchQuery.body.query.bool.filter.push({ match: { location } });
    }
    if (tags && tags.length > 0) {
      searchQuery.body.query.bool.filter.push({ terms: { tags } });
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
 * @param {Object} options - Search options including pagination
 * @param {number} options.from - Starting point for pagination
 * @param {number} options.size - Number of results to return
 * @returns {Array} Search results
 */
export async function semanticSearchSnippets(queryEmbedding, { from = 0, size = 10 }) {
  try {
    const searchQuery = {
      index: 'video_snippets',
      body: {
        query: {
          script_score: {
            query: { match_all: {} },
            script: {
              source: "cosineSimilarity(params.query_vector, doc['transcriptEmbedding']) + 1.0",
              params: { query_vector: queryEmbedding },
            },
          },
        },
        from,
        size,
      },
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
      // Generating embedding for direct API testing
      const queryEmbedding = await generateEmbedding(query);
      
      // Constructing filters object
      const filters = {
        ...(uploadDate && { uploadDate }),
        ...(location && { location }),
        ...(tags && { tags: tags.split(',') }), // Assumes tags come as comma-separated string
      };

      // Executing search based on type
      const results = type === 'snippet'
        ? await semanticSearchSnippets(queryEmbedding, { from: Number(from), size: Number(size) })
        : await semanticSearchVideos(queryEmbedding, { 
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


// Summary of Return Values for Semantic Search Functions
/**
 * The `semanticSearchVideos` function returns an array of video objects that match the semantic search criteria.
 * Each object includes all fields from the videos index, such as:
 * - title: The title of the video
 * - description: A description of the video content
 * - tags: Any tags associated with the video
 * - uploadDate: The date the video was uploaded
 * - baseVideoURL: The URL to access the video
 * - Any other metadata present in the video document
 * 
 * The `semanticSearchSnippets` function returns an array of snippet objects that match the semantic search criteria.
 * Each object includes all fields from the video snippets index, such as:
 * - snippetText: The text of the snippet
 * - associatedVideoInfo: Metadata about the video that the snippet belongs to
 * - snippetURL: The URL to access the snippet
 * - Any other metadata present in the snippet document
 */