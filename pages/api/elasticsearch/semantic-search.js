// pages/api/semantic-search.js
import client from '../../utils/elasticsearch';

async function semanticSearch(query) {
  try {
    const response = await client.search({
      index: 'videos',
      body: {
        query: {
          semantic: {
            field: 'transcriptEmbedding',
            query: query
          }
        }
      }
    });
    return response.hits.hits;
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query } = req.query;
    try {
      const results = await semanticSearch(query);
      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ message: 'Error performing semantic search' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
