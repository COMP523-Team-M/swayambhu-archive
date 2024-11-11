// pages/api/setup-indexes.js
import client from '../../utils/elasticsearch';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Define 'videos' index
      await client.indices.create({
        index: 'videos',
        body: {
          mappings: {
            properties: {
              vidID: { type: 'keyword' },               // Unique identifier, exact match
              vidDescription: { type: 'text' },         // Full-text searchable
              uploadDate: { type: 'date' },             // Date field
              recordDate: { type: 'date' },             // Date field
              location: { type: 'text' },               // Full-text searchable
              transcript: { type: 'text' },             // Full transcript for search
              tags: { type: 'text' },                   // Array of tags (auto-handled as array)
              baseVideoURL: { type: 'text' }            // Base YouTube URL for video
            },
          },
        },
      });

      // Define 'video_snippets' index
      await client.indices.create({
        index: 'video_snippets',
        body: {
          mappings: {
            properties: {
              transcriptID: { type: 'keyword' },        // Unique identifier for each snippet
              vidID: { type: 'keyword' },               // Foreign key reference to video
              timeSegment: { type: 'integer' },         // Store as integer seconds
              transcriptSnippet: { type: 'text' },      // Snippet for search
              videoLinkToSnippet: { type: 'text' }      // URL link to snippet
            },
          },
        },
      });

      res.status(200).json({ message: 'Indexes created successfully' });
    } catch (error) {
      console.error('Error creating indexes:', error);
      res.status(500).json({ message: 'Error creating indexes' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
