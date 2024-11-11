// pages/api/elasticsearch/delete-video.js
import client from '../../../utils/elasticsearch';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { vidID } = req.query;  // Assuming vidID is passed as a query parameter

    try {
      // Step 1: Delete the main video document from the 'videos' index
      await client.delete({
        index: 'videos',
        id: vidID,
      });

      // Step 2: Delete all related snippets for the video from the 'video_snippets' index
      await client.deleteByQuery({
        index: 'video_snippets',
        body: {
          query: {
            match: { vidID },
          },
        },
      });

      res.status(200).json({ message: 'Video and associated snippets deleted successfully' });
    } catch (error) {
      console.error('Error deleting video and snippets:', error);
      res.status(500).json({ message: 'Failed to delete video and snippets' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}


