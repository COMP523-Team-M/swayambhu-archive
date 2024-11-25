// utils/elasticsearch.js
import { Client } from '@elastic/elasticsearch';

const client = new Client({
  cloud: {
    id: process.env.ELASTIC_CLOUD_ID,
  },
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY,
  },
});

export default client;
