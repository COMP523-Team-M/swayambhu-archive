import { NextResponse } from 'next/server';
import client from '../../../utils-ts/elasticsearch';

interface VideoData {
  vidID: string;
  vidTitle: string;
  vidDescription: string;
  uploadDate: string;
  recordDate: string;
  location: string;
  transcript: string;
  englishTranslation: string;
  tags: string[];
  baseVideoURL: string;
  transcriptJson: any;
  englishTranscriptJson: any;
  transcriptEmbedding: number[];
}

export async function GET() {
  try {
    const response = await client.search({
      index: 'videos',
      body: {
        query: {
          match_all: {}
        }
      }
    });

    const results = response.hits.hits.map(hit => hit._source);

    return NextResponse.json({
      results
    });

  } catch (error) {
    console.error('Error fetching all videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}


// The response object contains a "results" array, where each element is an object representing a video.
// Each video object has the following properties:
// - vidID: string
// - vidTitle: string
// - vidDescription: string
// - uploadDate: string
// - recordDate: string
// - location: string
// - transcript: string
// - englishTranslation: string
// - tags: string[]
// - baseVideoURL: string
// - transcriptJson: any
// - englishTranscriptJson: any
// - transcriptEmbedding: number[]