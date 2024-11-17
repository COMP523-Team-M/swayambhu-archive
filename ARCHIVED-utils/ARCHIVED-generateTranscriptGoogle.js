// utils/generateTranscriptGoogle.js

import { Storage } from '@google-cloud/storage';
import { SpeechClient } from '@google-cloud/speech';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Set up clients
const storage = new Storage({ keyFilename: process.env.PATH_TO_CLOUD_STORAGE_CRED_JSON_KEY });
const speechClient = new SpeechClient({ keyFilename: process.env.PATH_TO_SPEECH_TO_TEXT_CRED_JSON_KEY });

// Configure bucket name
const bucketName = 'swayambhu-video-bucket';

async function uploadToStorage(filePath) {
  const fileName = path.basename(filePath);
  const bucket = storage.bucket(bucketName);
  await bucket.upload(filePath, {
    destination: fileName,
    public: true,
  });
  console.log(`File ${fileName} uploaded to ${bucketName}.`);
  return `gs://${bucketName}/${fileName}`;
}

async function transcribeAudio(uri) {
    const [operation] = await speechClient.longRunningRecognize({
      audio: { uri },
      config: {
        encoding: 'MP3',
        sampleRateHertz: 16000,
        languageCode: 'ne-NP'
      },
    });
    const [response] = await operation.promise();
    return response.results.map(result => result.alternatives[0].transcript).join('\n');
  }

async function translateText(text, targetLanguage = 'en') {
  const response = await axios.post(
    `https://translation.googleapis.com/language/translate/v2`,
    {},
    {
      params: {
        q: text,
        target: targetLanguage,
        key: process.env.GOOGLE_TRANSLATION_API_KEY,
      },
    }
  );
  return response.data.data.translations[0].translatedText;
}

export async function generateTranscriptGoogle(filePath) {
  try {
    const uri = await uploadToStorage(filePath);
    const nepaliTranscript = await transcribeAudio(uri);
    const englishTranslation = await translateText(nepaliTranscript);
    return { nepaliTranscript, englishTranslation };
  } catch (error) {
    console.error('Error generating transcript:', error);
    throw new Error('Failed to generate transcript and translation');
  }
}
