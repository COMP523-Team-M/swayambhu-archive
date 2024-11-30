// pages/api/test-openai-query.js
import { analyzeQuery } from '../../../utils/openaiQueryAnalysis';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query } = req.query;

    try {
      const result = await analyzeQuery(query);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in OpenAI query analysis:', error);
      res.status(500).json({ message: 'OpenAI query analysis failed' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
