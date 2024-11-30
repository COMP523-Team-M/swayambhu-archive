// pages/api/setup-indexes-with-embed.js
import client from '../../../utils/elasticsearch';
const axios = require('axios');

const ELASTIC_CLOUD_ENDPOINT = 'https://32eb2e.es.us-east1.gcp.elastic-cloud.com:443';

async function createInferenceEndpoint() {
  try {
    const response = await axios.put(`${ELASTIC_CLOUD_ENDPOINT}/_inference/text_embedding/my-e5-model`, {
      service: 'elasticsearch',
      service_settings: {
        num_allocations: 1,
        num_threads: 1,
        model_id: '.multilingual-e5-small'
      }
    }, {
      timeout: 60000 // Increase timeout to 60 seconds
    });
    console.log('Inference endpoint created:', response.data);
  } catch (error) {
    console.error('Error creating inference endpoint:', error.response ? error.response.data : error.message);
    console.error('Full error:', error);
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await createInferenceEndpoint();

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
              transcriptEmbedding: { type: 'semantic_text', inference_id: 'my-e5-model' }
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
              transcriptSnippet: { type: 'text' },
              englishTranslation: { type: 'text' },
              videoLinkToSnippet: { type: 'text' },
              snippetEmbedding: { type: 'semantic_text', inference_id: 'my-e5-model' }
            },
          },
        },
      });

      res.status(200).json({ message: 'Indexes and inference endpoint created successfully' });
    } catch (error) {
      console.error('Error creating indexes or inference endpoint:', error);
      res.status(500).json({ message: 'Error creating indexes or inference endpoint' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
