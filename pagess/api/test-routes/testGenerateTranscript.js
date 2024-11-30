// /pages/api/test-routes/test-translate.js

import { config } from 'dotenv';
const { TranslationServiceClient } = require('@google-cloud/translate');

config(); // Load environment variables

const translationClient = new TranslationServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Missing text or targetLanguage in request body' });
    }

    try {
      // Configure translation request
      const request = {
        parent: `projects/${process.env.GOOGLE_PROJECT_ID}/locations/global`,
        contents: [text],
        mimeType: 'text/plain',
        targetLanguageCode: targetLanguage,
      };

      // Translate the text
      const [response] = await translationClient.translateText(request);
      const translatedText = response.translations[0].translatedText;

      res.status(200).json({ originalText: text, translatedText });
    } catch (error) {
      console.error('Error during translation:', error);
      res.status(500).json({ error: 'Translation failed' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
