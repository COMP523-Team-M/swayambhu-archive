// pages/api/delete-indexes.js
import client from '../../../utils/elasticsearch';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    try {
      await client.indices.delete({ index: 'videos' });
      await client.indices.delete({ index: 'video_snippets' });
      res.status(200).json({ message: 'Indexes deleted successfully' });
    } catch (error) {
      console.error('Error deleting indexes:', error);
      res.status(500).json({ message: 'Error deleting indexes' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


