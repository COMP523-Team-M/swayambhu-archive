import { OpenAI } from 'openai';
import { generateEmbedding } from './generateEmbeddings';

// Type definitions
interface FilterableFields {
  video: string[];
  snippet: string[];
}

interface QueryAnalysis {
  searchType: 'keyword' | 'semantic' | 'combined';
  level: 'video' | 'snippet';
  keywords?: string[];
  filters?: {
    uploadDate?: string;
    location?: string;
  };
  reasoning: string;
}

interface SearchResult {
  searchType: 'keyword' | 'semantic' | 'combined';
  level: 'video' | 'snippet';
  filters: {
    uploadDate?: string;
    location?: string;
  };
  keywords?: string[];
  queryEmbedding?: number[];
}

// Constants
const FILTERABLE_FIELDS: FilterableFields = {
  video: ['uploadDate', 'location'],
  snippet: ['uploadDate']  // Snippets don't have location field
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeQuery(query: string): Promise<SearchResult> {
  try {
    // Step 1: Using OpenAI to classify and analyze the query
    const prompt = `
      You are a search query analyzer for a video search system. Analyze this query: "${query}"

      Classification Rules:
      1. Search Type:
         - "keyword": Simple queries with 1-3 specific terms (e.g., "pashupatinath temple", "evening aarti")
         - "semantic": Natural language questions or descriptions (e.g., "what activities happen at temples in evening?")
         - "combined": Complex queries with both specific terms and context (e.g., "evening aarti ceremonies at temples in Kathmandu")

      2. Search Level:
         - "video": For broad queries about entire videos or when time isn't important
         - "snippet": For queries about specific moments or when timing matters

      3. Extract only these filters if specifically mentioned:
         - uploadDate: Only if a specific date is mentioned (YYYY-MM-DD format)
         - location: Only if a specific place/location is mentioned

      4. Keywords:
         - Include all important search terms
         - Include topics and categories as keywords, not filters

      Respond in JSON format:
      {
        "searchType": "keyword|semantic|combined",
        "level": "video|snippet",
        "keywords": ["important", "search", "terms"],
        "filters": {
          "uploadDate": "YYYY-MM-DD" (only if specific date mentioned),
          "location": "place name" (only if location mentioned)
        },
        "reasoning": "Brief explanation of why this classification was chosen"
      }
    `;

    console.log('\nSending query to OpenAI for analysis...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response content from OpenAI');
    const result = JSON.parse(content) as QueryAnalysis;
    console.log('OpenAI Analysis:', result.reasoning);

    // Filter out fields that don't exist in the current index
    const validFilters: { uploadDate?: string; location?: string } = {};
    const allowedFields = FILTERABLE_FIELDS[result.level];
    
    if (result.filters) {
      Object.entries(result.filters).forEach(([key, value]) => {
        if (allowedFields.includes(key)) {
          validFilters[key as keyof typeof validFilters] = value;
        }
      });
    }

    // Step 2: Validate and adjust the classification
    const wordCount = query.split(' ').length;
    const hasQuestionWords = /^(what|where|when|how|why|who)\b/i.test(query);
    
    // Override rules
    if (hasQuestionWords && result.searchType === 'keyword') {
      console.log('Overriding to semantic search due to question format');
      result.searchType = 'semantic';
    }
    if (wordCount > 6 && result.searchType === 'keyword') {
      console.log('Overriding to combined search due to query complexity');
      result.searchType = 'combined';
    }

    // Step 3: Generate embeddings for semantic/combined search
    if (result.searchType === 'semantic' || result.searchType === 'combined') {
      console.log('Generating embeddings for', result.searchType, 'search');
      const queryEmbedding = await generateEmbedding(query);
      return {
        searchType: result.searchType,
        level: result.level,
        filters: validFilters,
        keywords: result.searchType === 'combined' ? result.keywords : undefined,
        queryEmbedding,
      };
    }

    // Step 4: Return keyword search parameters
    return {
      searchType: result.searchType,
      level: result.level,
      filters: validFilters,
      keywords: result.keywords,
    };

  } catch (error) {
    console.error('Error analyzing query:', error);
    throw new Error('Failed to analyze query');
  }
}