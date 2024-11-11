// pages/api/elasticsearch/nlp-search.js
import { analyzeQuery } from '../../../utils/openaiQueryAnalysis';
import { searchVideos, searchSnippets } from '../../../utils/elasticsearchQueries';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query } = req.query;

    try {
      // Step 1: Analyze query with OpenAI
      const { type, keywords } = await analyzeQuery(query);

      let searchResults;

      // Step 2: Route based on query type
      if (type === 'video-level') {
        searchResults = await searchVideos(keywords);  // Calls video search function
      } else if (type === 'snippet-level') {
        searchResults = await searchSnippets(keywords);  // Calls snippet search function
      }

      res.status(200).json({ results: searchResults });
    } catch (error) {
      console.error('Error in search:', error);
      res.status(500).json({ message: 'Search failed' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
