import { GET } from '../elasticsearch/CRUD/get-video/route';
import client from '../../../utils-ts/elasticsearch';
import { NextRequest } from 'next/server';

jest.mock('../../../utils-ts/elasticsearch', () => ({
  get: jest.fn()
}));

describe('GET /api/get-video', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully fetch a video', async () => {
    const mockVideo = {
      _source: {
        vidID: 'test-123',
        vidTitle: 'Test Video',
        vidDescription: 'Test Description',
        uploadDate: '2024-03-19',
        recordDate: '2024-03-18',
        location: 'Nepal',
        transcript: 'Test transcript',
        englishTranslation: 'Test English translation',
        tags: ['temple', 'history'],
        baseVideoURL: 'https://youtube.com/watch?v=test-123',
        transcriptJson: { results: [] },
        englishTranscriptJson: { results: [] },
        transcriptEmbedding: new Array(3072).fill(0.1)
      },
      found: true
    };

    (client.get as jest.Mock).mockResolvedValueOnce(mockVideo);

    const url = new URL('http://localhost:3000/api/get-video?vidID=test-123');
    const request = new NextRequest(url);
    
    const response = await GET(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.vidID).toBe('test-123');
    expect(data.vidTitle).toBe('Test Video');
    expect(data.vidDescription).toBe('Test Description');

    expect(client.get).toHaveBeenCalledWith({
      index: 'videos',
      id: 'test-123'
    });
  });

  it('should handle missing video ID', async () => {
    const url = new URL('http://localhost:3000/api/get-video');
    const request = new NextRequest(url);
    
    const response = await GET(request);
    expect(response.status).toBe(400);
    
    const data = await response.json();
    expect(data.error).toBe('Video ID is required');
  });

  it('should handle non-existent video', async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({
      found: false
    });

    const url = new URL('http://localhost:3000/api/get-video?vidID=nonexistent');
    const request = new NextRequest(url);
    
    const response = await GET(request);
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data.error).toBe('Video not found');
  });

  it('should handle elasticsearch errors', async () => {
    (client.get as jest.Mock).mockRejectedValueOnce(
      new Error('Elasticsearch error')
    );

    const url = new URL('http://localhost:3000/api/get-video?vidID=test-123');
    const request = new NextRequest(url);
    
    const response = await GET(request);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch video data');
  });
});