import "whatwg-fetch";
import { TextEncoder, TextDecoder } from "util";

// Add environment variables needed for tests
process.env.ELASTIC_CLOUD_ID = "test-cloud-id";
process.env.ELASTICSEARCH_API_KEY = "test-api-key";
process.env.OPENAI_API_KEY = "test-openai-key";

declare global {
  var TextEncoder: (typeof globalThis)["TextEncoder"];
  var TextDecoder: (typeof globalThis)["TextDecoder"];
  var NextResponse: {
    json(data: any, init?: ResponseInit): Response;
  };
}

// Add Web API implementations
global.TextEncoder = TextEncoder as (typeof globalThis)["TextEncoder"];
global.TextDecoder = TextDecoder as (typeof globalThis)["TextDecoder"];

// Mock NextResponse with proper Response implementation
const MockNextResponse = {
  json(data: any, init?: ResponseInit) {
    const response = new Response(JSON.stringify(data), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers || {}),
      },
    });

    // Add status to response object
    Object.defineProperty(response, "status", {
      get() {
        return init?.status || 200;
      },
    });

    return response;
  },
};

global.NextResponse = MockNextResponse;
