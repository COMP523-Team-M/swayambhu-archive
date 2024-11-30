// /pages/api/test-routes/test-translate.js

export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { text, targetLanguage } = req.body;
  
      // Validate input
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Missing text or targetLanguage in request body' });
      }
  
      try {
        // Define the URL with API key and project ID
        const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATION_API_KEY}`;
  
        // Request payload for translation
        const body = {
          q: text,
          target: targetLanguage,
          format: 'text'
        };
  
        // Make the POST request to Google Cloud Translation API
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
  
        // Parse the response
        const data = await response.json();
  
        if (!response.ok) {
          // If there's an error with the translation API, log and return it
          console.error('Error during translation:', data.error);
          return res.status(response.status).json({ error: data.error.message });
        }
  
        // Return the translated text
        const translatedText = data.data.translations[0].translatedText;
        res.status(200).json({ originalText: text, translatedText });
        console.log('Translation successful:', translatedText);
      } catch (error) {
        console.error('Error during translation:', error);
        res.status(500).json({ error: 'Translation failed' });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
  