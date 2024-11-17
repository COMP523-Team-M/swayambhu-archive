// utils/generateTranscript.js
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export const generateTranscript = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    //  Generate the transcript in Nepali
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'ne'); // Nepali language code

    const transcriptResponse = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders()
      }
    });

    const nepaliTranscript = transcriptResponse.data.text;

    // Translate the transcript to English
    const translationResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Translate the following Nepali text to English in a natural, coherent way." },
        { role: "user", content: nepaliTranscript }
      ],
      max_tokens: 500,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const initialEnglishTranslation = translationResponse.data.choices[0].message.content.trim();

    // Refine the translation for quality and cultural context
    const refinementResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a skilled Nepali-English translator. Review the following translation, ensuring that it retains the original Nepali meaning, cultural context, and flows naturally. Focus on translating idioms and cultural phrases in a way that preserves their true meaning in English." },
        { role: "user", content: `Original Nepali Transcript: ${nepaliTranscript}` },
        { role: "user", content: `Initial English Translation: ${initialEnglishTranslation}` }
      ],
      max_tokens: 500,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const refinedEnglishTranslation = refinementResponse.data.choices[0].message.content.trim();

    return { nepaliTranscript, englishTranslation: refinedEnglishTranslation };
  } catch (error) {
    if (error.response) {
      console.error("Error from OpenAI API:", error.response.data);
    } else {
      console.error("Error in generateTranscript:", error.message);
    }
    throw new Error("Failed to generate transcript and translation");
  }
};
