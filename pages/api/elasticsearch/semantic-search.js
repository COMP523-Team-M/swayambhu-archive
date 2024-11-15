// pages/api/semantic-search.js
import client from '../../utils/elasticsearch';

async function semanticSearchVideos(query) {
  try {
    const response = await client.search({
      index: 'videos',
      body: {
        query: {
          semantic: {
            field: 'transcriptEmbedding',
            query: query,
          },
        },
      },
    });
    return response.hits.hits;
  } catch (error) {
    console.error('Error performing semantic search on videos:', error);
    throw error;
  }
}

async function semanticSearchSnippets(query) {
  try {
    const response = await client.search({
      index: 'video_snippets',
      body: {
        query: {
          semantic: {
            field: 'snippetEmbedding',
            query: query,
          },
        },
      },
    });
    return response.hits.hits;
  } catch (error) {
    console.error('Error performing semantic search on snippets:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query, type } = req.query;

    try {
      let results;
      if (type === 'snippet') {
        results = await semanticSearchSnippets(query);
      } else {
        results = await semanticSearchVideos(query);
      }
      res.status(200).json(results);
    } catch (error) {
      res.status(500).json({ message: 'Error performing semantic search' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
