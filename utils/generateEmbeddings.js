// utils/generateEmbeddings.js
import { OpenAI } from 'openai';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large', // Using the multilingual model to support nepali and english
      input: text,
      encoding_format: 'float'
    });
    const embedding = response.data[0].embedding;

    // Checking the dimensions of the generated embedding (must be 768)
    if (embedding.length !== 768) {
      throw new Error(`Generated embedding has incorrect dimensions: expected 768, got ${embedding.length}`);
    }

    console.log('Generated Embedding:', embedding); 
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
