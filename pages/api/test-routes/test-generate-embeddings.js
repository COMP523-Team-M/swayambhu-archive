// pages/api/test-generate-embedding.js
import { generateEmbedding } from '../../../utils/generateEmbeddings';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { text } = req.query;

    try {
      const embedding = await generateEmbedding(text);
      res.status(200).json(embedding);
    } catch (error) {
      console.error('Error generating embedding:', error);
      res.status(500).json({ message: 'Error generating embedding' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
