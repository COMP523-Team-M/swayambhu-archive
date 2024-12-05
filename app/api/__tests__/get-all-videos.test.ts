import { GET } from '../get-all-videos/route';
import client from '../../../utils-ts/elasticsearch';

jest.mock('../../../utils-ts/elasticsearch', () => ({
  search: jest.fn()
}));

describe('GET /api/get-all-videos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return videos with all required fields', async () => {
    const mockVideos = [
      {
        _source: {
          vidID: '1',
          vidTitle: 'Test Video 1',
          vidDescription: 'Description 1',
          uploadDate: '2024-01-01',
          recordDate: '2023-12-31',
          location: 'Nepal',
          transcript: 'Test transcript',
          englishTranslation: 'English transcript',
          tags: ['temple', 'history'],
          baseVideoURL: 'https://example.com/video1',
          transcriptJson: { results: [] },
          englishTranscriptJson: { results: [] },
          transcriptEmbedding: [0.1, 0.2, 0.3]
        }
      }
    ];

    (client.search as jest.Mock).mockResolvedValueOnce({
      hits: {
        hits: mockVideos
      }
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    
    const video = data.results[0];
    expect(video).toEqual(mockVideos[0]._source);
    expect(video).toHaveProperty('vidID');
    expect(video).toHaveProperty('vidTitle');
    expect(video).toHaveProperty('vidDescription');
    expect(video).toHaveProperty('uploadDate');
    expect(video).toHaveProperty('recordDate');
    expect(video).toHaveProperty('location');
    expect(video).toHaveProperty('transcript');
    expect(video).toHaveProperty('englishTranslation');
    expect(video).toHaveProperty('tags');
    expect(video).toHaveProperty('baseVideoURL');
    expect(video).toHaveProperty('transcriptJson');
    expect(video).toHaveProperty('englishTranscriptJson');
    expect(video).toHaveProperty('transcriptEmbedding');
  });

  it('should handle Elasticsearch errors', async () => {
    (client.search as jest.Mock).mockRejectedValueOnce(
      new Error('Elasticsearch error')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch videos');
  });

  it('should return empty results array when no videos exist', async () => {
    (client.search as jest.Mock).mockResolvedValueOnce({
      hits: {
        hits: []
      }
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toEqual([]);
    expect(Array.isArray(data.results)).toBe(true);
  });
});