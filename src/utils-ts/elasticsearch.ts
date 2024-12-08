// utils-ts/elasticsearch.ts
import { Client } from "@elastic/elasticsearch";

if (!process.env.ELASTIC_CLOUD_ID) {
  throw new Error("ELASTIC_CLOUD_ID is not defined in environment variables");
}

if (!process.env.ELASTICSEARCH_API_KEY) {
  throw new Error(
    "ELASTICSEARCH_API_KEY is not defined in environment variables",
  );
}

const client = new Client({
  cloud: {
    id: process.env.ELASTIC_CLOUD_ID,
  },
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY,
  },
});

export default client;
