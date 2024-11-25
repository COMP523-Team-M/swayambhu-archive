// pages/api/test-connection.js
import client from '../../../utils/elasticsearch';

export default async function handler(req, res) {
  try {
    const result = await client.cat.indices({ format: 'json' });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error connecting to Elasticsearch:', error);
    res.status(500).json({ message: 'Failed to connect to Elasticsearch' });
  }
}


