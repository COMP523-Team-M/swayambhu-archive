// pages/api/test-generate-embedding.js
import { generateEmbedding } from '../../../utils/generateEmbeddings';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { text } = req.body; // Extract `text` from the body

    // Validate input
    if (!text) {
      return res.status(400).json({ message: "'text' field is required in the request body" });
    }

    try {
      // Pass `text` directly to generateEmbedding as it expects a string
      const embedding = await generateEmbedding(text);
      res.status(200).json({ embedding });
    } catch (error) {
      console.error('Error generating embedding:', error);
      res.status(500).json({ message: 'Error generating embedding' });
    }
  } else {
    // Allow only POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
