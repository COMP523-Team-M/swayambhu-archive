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
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('\n=== Search Router Started ===');
  console.log('Query received:', req.query);

  const { query, from = 0, size = 10 } = req.query;

  // Input validation
  if (!query) {
    console.log('Error: Missing query parameter');
    return res.status(400).json({ error: 'Missing query parameter' });
  }
  if (size > 50) {
    console.log('Error: Page size too large');
    return res.status(400).json({ error: 'Maximum page size is 50' });
  }

  try {
    // Step 1: Analyze query
    console.log('\nAnalyzing query:', query);
    const analysis = await analyzeQuery(query);
    console.log('Analysis result:', {
      searchType: analysis.searchType,
      level: analysis.level,
      hasFilters: !!analysis.filters,
      hasKeywords: !!analysis.keywords,
      hasEmbedding: !!analysis.queryEmbedding
    });

    if (!analysis || !analysis.searchType) {
      throw new Error('Invalid query analysis result');
    }

    // Step 2: Get search parameters
    const { searchType = 'combined', level = 'video', filters = {}, keywords = [], queryEmbedding } = analysis;
    const searchParams = { filters, from: Number(from), size: Number(size) };

    // Step 3: Route to appropriate search
    console.log('\nRouting to:', searchType, 'search');
    let searchResults;

    switch (searchType) {
      case 'keyword':
        console.log('Executing keyword search with params:', {
          level,
          keywords: keywords.slice(0, 3), // Show first 3 keywords only
          filters: Object.keys(filters)
        });
        searchResults = level === 'video'
          ? await searchVideos({ keywords, ...searchParams })
          : await searchSnippets({ keywords, ...searchParams });
        break;

      case 'semantic':
        console.log('Executing semantic search with params:', {
          level,
          queryLength: queryEmbedding?.length,
          filters: Object.keys(filters)
        });
        searchResults = level === 'video'
          ? await semanticSearchVideos(queryEmbedding, query, searchParams)
          : await semanticSearchSnippets(queryEmbedding, query, searchParams);
        break;

      case 'combined':
      default:
        console.log('\n=== Combined Search Debug (Router) ===');
        console.log('Pre-search params:', {
          level,
          keywords: keywords.slice(0, 3),
          hasEmbedding: !!queryEmbedding,
          filters: Object.keys(filters),
          searchParams
        });
        
        const index = level === 'video' ? 'videos' : 'video_snippets';
        console.log('Calling combinedSearch with:', {
          keywordCount: keywords.length,
          index,
          hasEmbedding: !!queryEmbedding,
          searchParamsEmpty: Object.keys(searchParams).length === 0
        });
        
        searchResults = await combinedSearch(
          keywords,
          queryEmbedding,
          index,
          searchParams
        );
        
        console.log('Combined search returned:', {
          resultsLength: searchResults?.length,
          hasResults: !!searchResults,
          firstResult: searchResults?.[0] ? Object.keys(searchResults[0]) : 'no results'
        });
        break;
    }

    console.log('\nSearch completed');
    console.log('Results found:', searchResults.length);

    // Strip out embeddings before sending response
    const cleanResults = searchResults.map(result => {
      const { snippetEmbedding, transcriptEmbedding, ...cleanResult } = result;
      return cleanResult;
    });

    // Step 4: Return results with metadata
    res.status(200).json({
      results: cleanResults,
      metadata: {
        searchType,
        level,
        totalResults: cleanResults.length,
        page: Math.floor(from / size) + 1,
        pageSize: size
      }
    });

  } catch (error) {
    console.error('\nError in search router:', error);
    res.status(500).json({ 
      error: 'Search failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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