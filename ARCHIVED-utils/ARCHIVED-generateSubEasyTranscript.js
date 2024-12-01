import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

const SUBEASY_API_URL_UPLOAD = 'https://api.subeasy.ai/v1/upload';
const SUBEASY_API_KEY = process.env.SUBEASY_API_KEY;

export const generateSubEasyTranscript = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const fileExtension = filePath.split('.').pop().toLowerCase();
    if (!['mp3', 'aac'].includes(fileExtension)) {
      throw new Error("Unsupported file format. Only 'mp3' and 'aac' files are allowed.");
    }

    console.log(`Uploading file: ${filePath}`);
    console.log(`File extension: ${fileExtension}`);
    console.log(`File size: ${fs.statSync(filePath).size} bytes`);

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('clear_plus', 'true');
    formData.append('transcribe_language', 'ne-NP');

    console.log("FormData headers:", formData.getHeaders());

    const uploadResponse = await axios.post(SUBEASY_API_URL_UPLOAD, formData, {
      headers: {
        'apikey': SUBEASY_API_KEY,
        ...formData.getHeaders(),
      },
    });

    console.log("Upload response:", uploadResponse.data);

    if (uploadResponse.data.code !== 1) {
      throw new Error(`Upload failed: ${uploadResponse.data.message}`);
    }

    const { file_hash } = uploadResponse.data;
    console.log(`File successfully uploaded with file_hash: ${file_hash}`);

    return file_hash;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error("Error response from SubEasy API:", error.response.data);
    } else {
      console.error("Error in generateSubEasyTranscript:", error.message);
    }
    throw new Error("Failed to generate transcript and translation");
  }
};
