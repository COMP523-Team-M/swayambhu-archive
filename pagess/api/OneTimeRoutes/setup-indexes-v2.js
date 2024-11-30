import client from '../../../utils/elasticsearch';

export async function setupIndices() {
  try {
    // Create videos index
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
            transcriptJson: { 
              type: 'object',
              enabled: false  // Non-searchable
            },
            englishTranscriptJson: { 
              type: 'object',
              enabled: false  // Non-searchable
            },
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
            }
          }
        }
      }
    });

    // Create video_snippets index
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
            }
          }
        }
      }
    });

    console.log('Indices created successfully');
    return { message: 'Indices created successfully' };
  } catch (error) {
    console.error('Error creating indices:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const result = await setupIndices();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create indices' });
  }
}