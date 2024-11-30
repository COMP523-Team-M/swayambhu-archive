import { analyzeQuery } from '../../utils/analyzeQuery-v2';
import { searchVideos, searchSnippets } from './elasticsearch/search/keyword-search-v2';
import { semanticSearchVideos, semanticSearchSnippets } from './elasticsearch/search/semantic-search-v2';
import { combinedSearch } from './elasticsearch/search/combined-search-v2';

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
          keywords: keywords.slice(0, 3),
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
        break;
    }

    console.log('\nSearch completed');
    console.log('Results found:', searchResults.length);

    // Strip out only embeddings from results, keeping transcript JSONs
    const cleanResults = searchResults.map(result => {
      const { snippetEmbedding, transcriptEmbedding, ...cleanResult } = result;
      return cleanResult;
    });

    // If this was a snippet search, fetch the full video data for each result
    if (level === 'snippet') {
      const enhancedResults = await Promise.all(
        cleanResults.map(async (snippet) => {
          const videoDoc = await client.get({
            index: 'videos',
            id: snippet.vidID
          });
          
          return {
            ...snippet,
            videoData: {
              transcriptJson: videoDoc._source.transcriptJson,
              englishTranscriptJson: videoDoc._source.englishTranscriptJson
            }
          };
        })
      );
      
      // Return enhanced results for snippets
      return res.status(200).json({
        results: enhancedResults,
        metadata: {
          searchType,
          level,
          totalResults: enhancedResults.length,
          page: Math.floor(from / size) + 1,
          pageSize: size
        }
      });
    }

    // Return regular results for videos
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