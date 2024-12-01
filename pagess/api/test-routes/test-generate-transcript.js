import { generateSubEasyTranscript } from '../../../utils/generateSubEasyTranscript.js';
import fs from 'fs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({ message: 'File path is required' });
      }
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found at specified path' });
      }

      const { nepaliTranscript, englishTranslation } = await generateSubEasyTranscript(filePath);

      res.status(200).json({ nepaliTranscript, englishTranslation });
    } catch (error) {
      console.error('Error generating transcript:', error.message || error);
      res.status(500).json({
        message: 'Failed to generate transcript and translation',
        error: error.message || 'Unknown error',
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
