// utils/elasticsearchQueries.js
import client from '../../../../utils/elasticsearch';

// Function to search videos (video-level)
export async function searchVideos(keywords) {
  const videoSearchQuery = {
    index: 'videos',
    body: {
      query: {
        multi_match: {
          query: keywords, // Keywords from OpenAI
          fields: ['vidDescription', 'tags', 'transcript'],
          type: 'best_fields',
        },
      },
    },
  };
  const videoResponse = await client.search(videoSearchQuery);
  return videoResponse.hits.hits.map(hit => ({
    ...hit._source,
    baseVideoURL: hit._source.baseVideoURL,
  }));
}

// Function to search snippets (snippet-level)
export async function searchSnippets(keywords) {
  const snippetSearchQuery = {
    index: 'video_snippets',
    body: {
      query: {
        multi_match: {
          query: keywords, // Keywords from OpenAI
          fields: ['transcriptSnippet'],
          type: 'best_fields',
        },
      },
    },
  };
  const snippetResponse = await client.search(snippetSearchQuery);
  return snippetResponse.hits.hits.map(hit => ({
    ...hit._source,
    snippetURL: hit._source.videoLinkToSnippet,
  }));
}
