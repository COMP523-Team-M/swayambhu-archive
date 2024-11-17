import { Configuration, OpenAIApi } from 'openai';
import { generateEmbedding } from './generateEmbeddings';

const FILTERABLE_FIELDS = ['uploadDate', 'location', 'tags']; // fields that can be filtered on, to update just add to array

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

/**
 * Analyze the user's query using OpenAI to determine:
 * - Search type (keyword, semantic, combined)
 * - Search level (videos or snippets)
 * - Extracted filters for video-level searches
 * - Keywords for keyword and combined searches
 * - Embeddings for semantic and combined searches
 * 
 * @param {string} query - The user's natural language search query
 * @returns {Object} Analysis result with search type, level, keywords, embeddings, and filters
 */
export async function analyzeQuery(query) {
  try {
    // Step 1: Using OpenAI to classify and analyze the query
    const prompt = `
      You are a smart search assistant. Analyze the following query and provide:
      1. The search type (keyword, semantic, or combined) based on intent.
      2. Whether the search is at the video level or snippet level.
      3. Extract important keywords from the query for keyword-based searching.
      4. Extract filters if any filterable fields (${FILTERABLE_FIELDS.join(
        ', '
      )}) are mentioned in the query.
      Query: "${query}"
      Respond in JSON format as:
      {
        "searchType": "keyword|semantic|combined",
        "level": "video|snippet",
        "keywords": ["keyword1", "keyword2", ...],
        "filters": {
          "uploadDate": "value" (optional),
          "location": "value" (optional),
          "tags": ["value1", "value2"] (optional)
        }
      }
    `;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0, 
    });

    const result = JSON.parse(response.data.choices[0].message.content);

    // Step 2: Extracting details from OpenAI response
    const { searchType, level, filters, keywords } = result;

    // Step 3: Handle specific search types
    if (searchType === 'semantic' || searchType === 'combined') {
      const queryEmbedding = await generateEmbedding(query);
      return {
        searchType,
        level,
        filters,
        keywords: searchType === 'combined' ? keywords : undefined,
        queryEmbedding,
      };
    }

    // Step 4: Handle keyword-only search
    return {
      searchType,
      level,
      filters,
      keywords,
    };
  } catch (error) {
    console.error('Error analyzing query:', error);
    throw new Error('Failed to analyze query');
  }
}
