import client from '../../../../utils/elasticsearch';

/**
 * Determines the language of the query to decide whether to search in 'transcript' (Nepali) or 'englishTranslation' (English).
 * @param {Array} keywords - Array of keywords to check
 * @returns {string} - Field to search ('transcript' or 'englishTranslation')
 */
function determineSearchField(keywords) {
  const nepaliPattern = /[ऀ-ॿ]/; // Unicode range for Nepali script
  const keywordString = Array.isArray(keywords) ? keywords.join(' ') : keywords;
  return nepaliPattern.test(keywordString) ? 'transcript' : 'englishTranslation';
}

/**
 * Search videos using keywords and filters
 * @param {Object} params - Search parameters
 * @param {Array} params.keywords - Array of search keywords
 * @param {Object} params.filters - Optional filters
 * @param {string} params.filters.uploadDate - Optional date filter
 * @param {string} params.filters.location - Optional location filter
 * @param {Array} params.filters.tags - Optional tags filter
 * @param {number} params.from - Starting point for pagination
 * @param {number} params.size - Number of results to return
 * @returns {Array} Search results
 */
export async function searchVideos({ keywords, filters = {}, from = 0, size = 10 }) {
  const { uploadDate, location, tags } = filters;
  const searchField = determineSearchField(keywords);
  const keywordString = Array.isArray(keywords) ? keywords.join(' ') : keywords;

  const videoSearchQuery = {
    index: 'videos',
    body: {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: keywordString,
                fields: ['vidDescription^2', 'tags^1.5', searchField], 
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: [],
        },
      },
      from,
      size,
    },
  };

  // Adding filters dynamically
  if (uploadDate && /^\d{4}-\d{2}-\d{2}$/.test(uploadDate)) {
    videoSearchQuery.body.query.bool.filter.push({ term: { uploadDate } });
  }
  if (location) {
    videoSearchQuery.body.query.bool.filter.push({ match: { location } });
  }
  if (tags && tags.length > 0) {
    videoSearchQuery.body.query.bool.filter.push({ terms: { tags } });
  }

  const videoResponse = await client.search(videoSearchQuery);
  return videoResponse.hits.hits.map(hit => ({
    ...hit._source,
    score: hit._score,
  }));
}

/**
 * Search snippets using keywords
 * @param {Object} params - Search parameters
 * @param {Array} params.keywords - Array of search keywords
 * @param {number} params.from - Starting point for pagination
 * @param {number} params.size - Number of results to return
 * @returns {Array} Search results
 */
export async function searchSnippets({ keywords, from = 0, size = 10 }) {
  const searchField = determineSearchField(keywords);
  const keywordString = Array.isArray(keywords) ? keywords.join(' ') : keywords;

  const snippetSearchQuery = {
    index: 'video_snippets',
    body: {
      query: {
        multi_match: {
          query: keywordString,
          fields: [searchField],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      },
      from,
      size,
    },
  };

  const snippetResponse = await client.search(snippetSearchQuery);
  return snippetResponse.hits.hits.map(hit => ({
    ...hit._source,
    score: hit._score,
  }));
}

/**
 * API Handler for direct keyword search testing
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { 
      query,
      type = 'video',
      from = 0,
      size = 10,
      uploadDate,
      location,
      tags 
    } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    try {
      // Simple keyword extraction for testing
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      
      // Constructing filters object
      const filters = {
        ...(uploadDate && { uploadDate }),
        ...(location && { location }),
        ...(tags && { tags: tags.split(',') }),
      };

      const results = type === 'snippet'
        ? await searchSnippets({ 
            keywords, 
            from: Number(from), 
            size: Number(size) 
          })
        : await searchVideos({ 
            keywords, 
            filters, 
            from: Number(from), 
            size: Number(size) 
          });

      res.status(200).json(results);
    } catch (error) {
      console.error('Error during keyword search:', error);
      res.status(500).json({ error: 'Keyword search failed' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}



// Summary of Return Values for Keyword Search Functions
/**
 * The `searchVideos` function returns an array of video objects that match the keyword search criteria.
 * Each object includes all fields from the corresponding document in the videos index, such as:
 * - title: The title of the video
 * - description: A description of the video content
 * - tags: Any tags associated with the video
 * - uploadDate: The date the video was uploaded
 * - baseVideoURL: The URL to access the video
 * - Any other metadata present in the video document
 * - score: The relevance score indicating how well the result matches the search criteria
 * 
 * The `searchSnippets` function returns an array of snippet objects that match the keyword search criteria.
 * Each object includes all fields from the corresponding document in the video snippets index, such as:
 * - snippetText: The text of the snippet
 * - associatedVideoInfo: Metadata about the video that the snippet belongs to
 * - snippetURL: The URL to access the snippet
 * - Any other metadata present in the snippet document
 * - score: The relevance score indicating how well the result matches the search criteria
 * 
 * The API handler returns the results of the keyword search as a JSON response.
 */