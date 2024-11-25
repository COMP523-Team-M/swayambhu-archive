// pages/api/setup-ingest-pipeline.js
import client from '../../../utils/elasticsearch';

async function createIngestPipeline() {
  try {
    const response = await client.ingest.putPipeline({
      id: 'embedding-pipeline',
      body: {
        processors: [
          {
            inference: {
              model_id: 'my-elser-endpoint',
              target_field: 'transcriptEmbedding',
              field_map: {
                'transcript': 'transcriptEmbedding'
              }
            }
          },
          {
            inference: {
              model_id: 'my-elser-endpoint',
              target_field: 'snippetEmbedding',
              field_map: {
                'transcriptSnippet': 'snippetEmbedding'
              }
            }
          }
        ]
      }
    });
    console.log('Ingest pipeline created:', response);
  } catch (error) {
    console.error('Error creating ingest pipeline:', error);
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await createIngestPipeline();
      res.status(200).json({ message: 'Ingest pipeline created successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error creating ingest pipeline' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
