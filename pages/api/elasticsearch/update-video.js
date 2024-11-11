// pages/api/elasticsearch/update-video.js
import client from '../../../utils/elasticsearch';
import { v4 as uuidv4 } from 'uuid';

/**
 * Splits the transcript into segments of specified word count.
 * @param {string} transcript - Full transcript text.
 * @param {number} segmentLength - Target number of words per segment.
 * @returns {Array} Array of transcript segments.
 */
function splitTranscript(transcript, segmentLength = 25) {
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
  if (req.method === 'PUT') {
    const { vidID, vidDescription, uploadDate, recordDate, location, transcript, tags, baseVideoURL } = req.body;

    try {
      // Step 1: Update the main video metadata in the 'videos' index
      const videoUpdateBody = {
        doc: {
          vidDescription,
          uploadDate,
          recordDate,
          location,
          tags,
          baseVideoURL,
        },
      };

      if (transcript) {
        videoUpdateBody.doc.transcript = transcript; // Only adding transcript if provided
      }

      await client.update({
        index: 'videos',
        id: vidID,
        body: videoUpdateBody,
      });

      // Step 2: Update snippets if transcript has changed
      if (transcript) {
        // Delete existing snippets for the video
        await client.deleteByQuery({
          index: 'video_snippets',
          body: {
            query: {
              match: { vidID },
            },
          },
        });

        // Re-segment the updated transcript
        const transcriptSegments = splitTranscript(transcript, 25);

        // Add each new snippet to the 'video_snippets' index with updated URLs
        for (let i = 0; i < transcriptSegments.length; i++) {
          const transcriptSnippet = transcriptSegments[i];
          const transcriptID = uuidv4(); // Generate new unique ID for each snippet
          const timeSegment = i * 10; // Each snippet corresponds to 10 seconds

          // Generate new YouTube link for each snippet based on updated time segment
          const videoLinkToSnippet = `${baseVideoURL}&t=${timeSegment}s`;

          await client.index({
            index: 'video_snippets',
            id: transcriptID,
            body: {
              transcriptID,
              vidID,
              timeSegment,
              transcriptSnippet,
              videoLinkToSnippet,
            },
          });
        }
      }

      res.status(200).json({ message: 'Video and associated snippets updated successfully' });
    } catch (error) {
      console.error('Error updating video data:', error);
      res.status(500).json({ message: 'Failed to update video data' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
