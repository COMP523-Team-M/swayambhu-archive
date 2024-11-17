// pages/api/search-router.js
import { analyzeQuery } from '../../utils/analyzeQuery-v2';
import { searchVideos, searchSnippets } from './elasticsearch/search/keyword-search';
import { semanticSearchVideos, semanticSearchSnippets } from './elasticsearch/search/semantic-search';
import { combinedSearch } from './elasticsearch/search/combined-search';

/**
 * API route handler for unified search functionality
 * Analyzes query intent and routes to appropriate search function
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query, from = 0, size = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    try {
      // Step 1: Analyze the query
      const analysis = await analyzeQuery(query);

      // Destructure analysis results with defaults
      const { searchType, level, filters = {}, keywords = [], queryEmbedding } = analysis;

      let searchResults;

      // Step 2: Route based on search type
      switch (searchType) {
        case 'keyword':
          searchResults = level === 'video'
            ? await searchVideos({ keywords, filters, from, size })
            : await searchSnippets({ keywords, from, size });
          break;

        case 'semantic':
          searchResults = level === 'video'
            ? await semanticSearchVideos(queryEmbedding, { filters, from, size })
            : await semanticSearchSnippets(queryEmbedding, { from, size });
          break;

        case 'combined':
          const index = level === 'video' ? 'videos' : 'video_snippets';
          searchResults = await combinedSearch(
            keywords,
            queryEmbedding,
            index,
            { filters, from, size }
          );
          break;

        default:
          throw new Error('Invalid search type');
      }

      // Step 3: Return results
      res.status(200).json({ results: searchResults });
    } catch (error) {
      console.error('Error handling search:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


/**
 * Summary of Search Route Returns:
 * 
 * The `nlp-search` route handler analyzes the incoming query and routes it to the appropriate search function based on the determined search type:
 * 
 * 1. **Keyword Search**:
 *    - If the search type is 'keyword' and the level is 'video', it returns an array of video objects that match the keywords.
 *    - If the level is 'snippet', it returns an array of snippet objects that match the keywords.
 * 
 * 2. **Semantic Search**:
 *    - If the search type is 'semantic' and the level is 'video', it returns an array of video objects that match the semantic search criteria using embeddings.
 *    - If the level is 'snippet', it returns an array of snippet objects that match the semantic search criteria using embeddings.
 * 
 * 3. **Combined Search**:
 *    - If the search type is 'combined', it returns results from both keyword and semantic searches based on the specified index (either 'videos' or 'video_snippets').
 * 
 * **Format of the Results**:
 * 
 * Each search result is returned in the following format:
 * 
 * - For **Videos**:
 *   ```json
 *   {
 *     "results": [
 *       {
 *         "vidID": "123",             // Unique identifier for the video
 *         "vidDescription": "History of the ancient temple",
 *         "uploadDate": "2023-01-01",
 *         "location": "Nepal",
 *         "transcript": "... full transcript text ...",
 *         "tags": ["history", "temple", "culture"],
 *         "baseVideoURL": "https://youtube.com/watch?v=video123" // Full video link
 *       },
 *       ...
 *     ]
 *   }
 *   ```
 * 
 * - For **Snippets**:
 *   ```json
 *   {
 *     "results": [
 *       {
 *         "transcriptID": "abc",      // Unique identifier for the snippet
 *         "vidID": "123",             // ID of the associated video
 *         "timeSegment": 30,          // Start time of the snippet in seconds
 *         "transcriptSnippet": "This is a snippet of the transcript.",
 *         "englishTranslation": "This is the English translation.",
 *         "videoLinkToSnippet": "https://youtube.com/watch?v=video123&t=30s" // Link to the video at the snippet time
 *       },
 *       ...
 *     ]
 *   }
 *   ```
 * 
 * Can access the results using:
 * - For videos: `results.results` to get the array of video objects.
 * - For snippets: `results.results` to get the array of snippet objects.
 * 
 * **Formatting the Search Request**:
 * 
 * To make a search request to this endpoint, the front-end should format the request as follows:
 * 
 * - **HTTP Method**: `GET`
 * - **Query Parameters**:
 *   - `query`: The search query string (required).
 *   - `from`: The starting point for pagination (optional, default is 0).
 *   - `size`: The number of results to return (optional, default is 10).
 * 
 * **Example Request**:
 * ```
 * GET /api/nlp-search-v2?query=temple&from=0&size=10
 * ```
 * This request searches for videos or snippets related to the term "temple", starting from the first result and returning up to 10 results.
 */