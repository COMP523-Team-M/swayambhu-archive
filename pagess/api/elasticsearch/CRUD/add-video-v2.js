import client from '../../../../utils/elasticsearch';
import { v4 as uuidv4 } from 'uuid';
import { generateEmbedding } from '../../../../utils/generateEmbeddings';

/**
 * Converts a time string (e.g., "0.320s" or "00:00.4") to total seconds as an integer.
 * @param {string} timeString - The time string to convert
 * @returns {number} The total time in seconds, rounded down to the nearest integer
 */
function convertTimeToSeconds(timeString) {
  // Remove 's' suffix if present
  timeString = timeString.replace('s', '');
  return Math.floor(parseFloat(timeString));
}

/**
 * Extracts segments from the JSON response with timestamps.
 * @param {Array} results - Array of transcription results with timestamps.
 * @param {string} baseVideoURL - The base URL of the video.
 * @returns {Array} Array of segment objects with time and text.
 */
function extractTranscriptSegments(results, baseVideoURL) {
  return results.map((result, index) => {
    const alternative = result.alternatives[0];
    const transcriptSnippet = alternative.transcript;
    
    // Get first and last word for timing
    const firstWord = alternative.words[0];
    const lastWord = alternative.words[alternative.words.length - 1];
    
    // Handle cases where startOffset might not be present in first word
    const startTime = firstWord.startOffset || firstWord.endOffset;
    const endTime = lastWord.endOffset;

    // Converting start and end times to seconds
    const startTimeInSeconds = convertTimeToSeconds(startTime);
    const endTimeInSeconds = convertTimeToSeconds(endTime);

    // Creating link to start the video at the beginning of this segment
    const videoLinkToSnippet = `${baseVideoURL}&t=${startTimeInSeconds}s`;

    return {
      transcriptSnippet,
      startTime: startTimeInSeconds,
      endTime: endTimeInSeconds,
      videoLinkToSnippet,
      transcriptSegmentIndex: index,  // Add segment index
    };
  });
}

/**
 * Translates a given text from Nepali to English using Google Cloud Translation API.
 * @param {string} text - The text to translate.
 * @returns {string} Translated text in English.
 */
async function translateText(text) {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATION_API_KEY}`;

  const body = {
    q: text,
    target: 'en',
    format: 'text',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Error during translation:', data.error);
    throw new Error(data.error.message || 'Translation failed');
  }

  return data.data.translations[0].translatedText;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { vidDescription, uploadDate, recordDate, location, transcriptJson, tags, baseVideoURL } = req.body;

      if (!transcriptJson || !transcriptJson.results) {
        return res.status(400).json({ message: 'Invalid transcript JSON format' });
      }

      // Step 1: Generate a unique vidID
      const vidID = uuidv4();

      // Step 2: Convert JSON transcript to plain text and generate embedding
      const transcriptText = transcriptJson.results.map(result => result.alternatives[0].transcript).join(' ');
      const transcriptEmbedding = await generateEmbedding(transcriptText);

      // Step 3: Create English version of transcript JSON
      const englishTranscriptJson = {
        results: await Promise.all(transcriptJson.results.map(async (result) => ({
          alternatives: [{
            ...result.alternatives[0],
            transcript: await translateText(result.alternatives[0].transcript)
          }]
        })))
      };

      // Step 4: Translate full transcript to English
      const englishTranscript = await translateText(transcriptText);

      // Step 5: Insert metadata and full transcript with embedding into the 'videos' index
      await client.index({
        index: 'videos',
        id: vidID,
        body: {
          vidID,
          vidDescription,
          uploadDate,
          recordDate,
          location,
          transcript: transcriptText,
          englishTranslation: englishTranscript,
          tags,
          baseVideoURL,
          transcriptJson,           // Original Nepali JSON
          englishTranscriptJson,    // English version
          transcriptEmbedding,
        },
      });

      // Step 6: Extract segments with timestamps from the transcript JSON
      const transcriptSegments = extractTranscriptSegments(transcriptJson.results, baseVideoURL);

      // Step 7: Add each transcript snippet to the 'video_snippets' index with generated embeddings
      for (const segment of transcriptSegments) {
        const transcriptID = uuidv4();

        // Generate embedding for each transcript snippet
        const snippetEmbedding = await generateEmbedding(segment.transcriptSnippet);

        // Translate the snippet to English
        const englishSnippet = await translateText(segment.transcriptSnippet);

        await client.index({
          index: 'video_snippets',
          id: transcriptID,
          body: {
            transcriptID,
            vidID,
            timeSegment: segment.startTime,
            endTime: segment.endTime,
            transcriptSnippet: segment.transcriptSnippet,
            englishTranslation: englishSnippet,
            videoLinkToSnippet: segment.videoLinkToSnippet,
            snippetEmbedding,
          },
        });
      }

      res.status(200).json({ message: 'Video and transcript snippets added successfully' });
    } catch (error) {
      console.error('Error adding video data:', error);
      res.status(500).json({ message: 'Failed to add video data' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}