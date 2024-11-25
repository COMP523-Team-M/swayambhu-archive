// pages/api/elasticsearch/add-video.js
import client from '../../../../utils/elasticsearch';
import { v4 as uuidv4 } from 'uuid';

/**
 * Splits the transcript into segments of specified word count.
 * @param {string} transcript - Full transcript text.
 * @param {number} segmentLength - Target number of words per segment.
 * @returns {Array} Array of transcript segments.
 */
function splitTranscript(transcript, segmentLength = 25) {  // Adjusted to 25 words
  const words = transcript.split(" ");
  const segments = [];
  let segment = [];
  let wordCount = 0;
  
  words.forEach((word) => {
    segment.push(word);
    wordCount += 1;
    
    if (wordCount >= segmentLength) {
      segments.push(segment.join(" "));
      segment = [];
      wordCount = 0;
    }
  });

  if (segment.length > 0) {
    segments.push(segment.join(" "));
  }
  
  return segments;
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { vidDescription, uploadDate, recordDate, location, transcript, tags, baseVideoURL } = req.body;

      // Step 1: Generate a unique vidID
      const vidID = uuidv4();

      // Step 2: Insert metadata into the 'videos' index
      await client.index({
        index: 'videos',
        id: vidID,
        body: {
          vidID,
          vidDescription,
          uploadDate,
          recordDate,
          location,
          transcript, // Full transcript for reference
          tags,
          baseVideoURL, // Store base video URL in the videos index
        },
      });

      // Step 3: Split the transcript into segments
      const transcriptSegments = splitTranscript(transcript, 25); // 25 words per segment

      // Step 4: Add each transcript snippet to the 'video_snippets' index with a generated URL
      for (let i = 0; i < transcriptSegments.length; i++) {
        const transcriptSnippet = transcriptSegments[i];
        const transcriptID = uuidv4(); // Unique ID for each snippet
        const timeSegment = i * 10; // Assuming each segment corresponds to 10 seconds

        // Generate a YouTube link that starts at the specific timestamp
        const videoLinkToSnippet = `${baseVideoURL}&t=${timeSegment}s`;

        await client.index({
          index: 'video_snippets',
          id: transcriptID,
          body: {
            transcriptID,
            vidID,
            timeSegment, // Stored as integer seconds
            transcriptSnippet,
            videoLinkToSnippet,
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
