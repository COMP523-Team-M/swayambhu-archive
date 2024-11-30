import client from '../../../utils/elasticsearch';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Define 'videos' index
      await client.indices.create({
        index: 'videos',
        body: {
          mappings: {
            properties: {
              vidID: { type: 'keyword' },
              vidDescription: { type: 'text' },
              uploadDate: { type: 'date' },
              recordDate: { type: 'date' },
              location: { type: 'text' },
              transcript: { type: 'text' },
              englishTranslation: { type: 'text' },
              tags: { type: 'text' },
              baseVideoURL: { type: 'text' },
              transcriptEmbedding: {
                type: 'dense_vector',
                dims: 3072,
                index: true,
                similarity: 'cosine',
                index_options: {
                  type: 'hnsw',
                  m: 16,
                  ef_construction: 100
                }
              },
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
              transcriptID: { type: 'keyword' },
              vidID: { type: 'keyword' },
              timeSegment: { type: 'integer' },
              endTime: { type: 'integer' },
              transcriptSnippet: { type: 'text' },
              englishTranslation: { type: 'text' },
              videoLinkToSnippet: { type: 'text' },
              snippetEmbedding: {
                type: 'dense_vector',
                dims: 3072,
                index: true,
                similarity: 'cosine',
                index_options: {
                  type: 'hnsw',
                  m: 16,
                  ef_construction: 100
                }
              },
            },
          },
        },
      });

      res.status(200).json({ message: 'Indexes created successfully with dense_vector fields and HNSW configuration' });
    } catch (error) {
      console.error('Error creating indexes:', error);
      res.status(500).json({ message: 'Failed to create indexes', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
