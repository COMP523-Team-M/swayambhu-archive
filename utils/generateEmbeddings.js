// utils/generateEmbeddings.js
import { OpenAI } from 'openai';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large', // Use the multilingual model
      input: text,
      encoding_format: 'float'
    });
    const embedding = response.data[0].embedding;
    console.log('Generated Embedding:', embedding); // Log the embedding to the console
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
