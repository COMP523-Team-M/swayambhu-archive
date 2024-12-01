import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export const generateTranscript = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('model', 'whisper-1');
    formData.append('language', 'ne'); // Nepali language code
    formData.append('temperature', '0.2'); // Lower temperature for consistency in clear audio
    formData.append('beam_size', '3'); // Moderate beam search for accuracy
    formData.append('condition_on_previous_text', 'true'); // Maintain transcription continuity

    // Transcribe the entire file at once
    const transcriptResponse = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    });

    const nepaliTranscript = transcriptResponse.data.text;

    // Translate to English
    const translationResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Translate the following Nepali text to English in a natural, coherent way." },
        { role: "user", content: nepaliTranscript }
      ],
      max_tokens: 1500,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const initialEnglishTranslation = translationResponse.data.choices[0].message.content.trim();

    // Refine the translation
    const refinementResponse = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a skilled Nepali-English translator. Review the following translation, ensuring that it retains the original Nepali meaning, cultural context, and flows naturally. Focus on translating idioms and cultural phrases in a way that preserves their true meaning in English." },
        { role: "user", content: `Original Nepali Transcript: ${nepaliTranscript}` },
        { role: "user", content: `Initial English Translation: ${initialEnglishTranslation}` }
      ],
      max_tokens: 1500,
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
