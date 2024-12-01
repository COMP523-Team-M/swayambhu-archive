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
                  source: "cosineSimilarity(params.query_vector, 'transcriptEmbedding') + 1.0",
                  params: { query_vector: queryEmbedding }
                }
              }
            }],
            filter: [] // Filters will be added dynamically
          }
        },
        from,
        size
      }
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
              source: "cosineSimilarity(params.query_vector, 'transcriptEmbedding') + 1.0",
              params: { query_vector: queryEmbedding }
            }
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
      // Generating embedding for direct API testing
      const queryEmbedding = await generateEmbedding(query);
      console.log('Generated Embedding:', queryEmbedding);
      
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

/**
 * The semanticSearchVideos function returns an array of video objects that match the semantic search criteria.
 * Each object includes:
 * - vidID: Unique identifier for the video
 * - vidDescription: Description of the video content
 * - uploadDate: Date the video was uploaded
 * - recordDate: Date the video was recorded
 * - location: Location where the video was recorded
 * - transcript: Full transcript text
 * - englishTranslation: English translation of the transcript
 * - tags: Array of tags associated with the video
 * - baseVideoURL: URL to access the video
 * - score: Relevance score from the search
 * 
 * The semanticSearchSnippets function returns an array of snippet objects that match the semantic search criteria.
 * Each object includes:
 * - transcriptID: Unique identifier for the snippet
 * - vidID: ID of the parent video
 * - timeSegment: Start time of the snippet
 * - endTime: End time of the snippet
 * - transcriptSnippet: Text content of the snippet
 * - englishTranslation: English translation of the snippet
 * - videoLinkToSnippet: URL to the video at the specific timestamp
 * - score: Relevance score from the search
 */