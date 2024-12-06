// utils-ts/generateEmbeddings.ts
import { OpenAI } from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined in environment variables');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large', // Using the multilingual model to support nepali and english
      input: text,
      encoding_format: 'float'
    });
    
    const embedding = response.data[0].embedding;

    // Checking the dimensions of the generated embedding (must be 3072)
    if (embedding.length !== 3072) {
      throw new Error(`Generated embedding has incorrect dimensions: expected 3072, got ${embedding.length}`);
    }

    console.log('Generated Embedding:', embedding); 
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}