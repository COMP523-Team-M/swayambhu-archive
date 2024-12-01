// pages/api/elasticsearch/video-search.js
import client from '../../../../utils/elasticsearch';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { query, uploadDate, location, tags } = req.query;

    try {
      // Construct Elasticsearch query for general video search
      const videoSearchQuery = {
        index: 'videos',
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query, // Main search keywords
                    fields: ['vidDescription', 'tags', 'transcript'], // Fields to search in
                    type: 'best_fields', // Explicitly set to 'best_fields' (default)
                  },
                },
              ],
              filter: [],
            },
          },
        },
      };

      // Validate and add uploadDate filter if in YYYY-MM-DD format
      if (uploadDate && /^\d{4}-\d{2}-\d{2}$/.test(uploadDate)) {
        videoSearchQuery.body.query.bool.filter.push({ term: { uploadDate } });
      }

      // Add location filter if provided
      if (location) {
        videoSearchQuery.body.query.bool.filter.push({ match: { location } });
      }

      // Add tags filter if provided
      if (tags) {
        videoSearchQuery.body.query.bool.filter.push({ match: { tags } });
      }

      // Execute search
      const videoResponse = await client.search(videoSearchQuery);

      // Map over results to extract relevant data
      const videoResults = videoResponse.hits.hits.map(hit => ({
        ...hit._source,
        baseVideoURL: hit._source.baseVideoURL, // Add base video URL for each video
      }));

      /**
       * Returns:
       * [
       *   {
       *     vidID: "123",             // Unique identifier for the video
       *     vidDescription: "History of the ancient temple",
       *     uploadDate: "2023-01-01",
       *     location: "Nepal",
       *     transcript: "... full transcript text ...",
       *     tags: ["history", "temple", "culture"],
       *     baseVideoURL: "https://youtube.com/watch?v=video123" // Full video link
       *   },
       *   {
       *     vidID: "456",
       *     vidDescription: "Exploring temples around the world",
       *     uploadDate: "2022-12-15",
       *     location: "India",
       *     transcript: "... full transcript text ...",
       *     tags: ["travel", "temples", "world"],
       *     baseVideoURL: "https://youtube.com/watch?v=video456" // Full video link
       *   },
       *   ...
       * ]
       * 
       * Each object represents a matching video and includes:
       * - `vidID`: Unique ID for the video
       * - `vidDescription`: Description of the video
       * - `uploadDate`: Date the video was uploaded
       * - `location`: Location associated with the video
       * - `transcript`: Full transcript text
       * - `tags`: Array of tags related to the video
       * - `baseVideoURL`: Direct link to the full video on YouTube
       * 
       * Front-end developers can map over `results` to extract `baseVideoURL`:
       *   const urls = results.map(video => video.baseVideoURL);
       */

      res.status(200).json({ results: videoResults });
    } catch (error) {
      console.error('Error in video search:', error);
      res.status(500).json({ message: 'Video search failed' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
