import { POST } from '../elasticsearch/CRUD/add-video/route';
import client from '../../../utils-ts/elasticsearch';
import { generateEmbedding } from '../../../utils-ts/generateEmbeddings';

jest.mock('../../../utils-ts/elasticsearch', () => ({
  index: jest.fn(),
  get: jest.fn()
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

jest.mock('../../../utils-ts/generateEmbeddings', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(3072).fill(0.1))
}));

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: {
        translations: [{ translatedText: 'English translation' }]
      }
    })
  })
) as jest.Mock;

describe('POST /api/add-video', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully add a video and its transcript snippets', async () => {
    const mockRequestBody = {
      vidTitle: 'Test Video',
      vidDescription: 'Test Description',
      uploadDate: '2024-03-19',
      recordDate: '2024-03-18',
      location: 'Nepal',
      tags: ['temple', 'history'],
      baseVideoURL: 'https://youtube.com/watch?v=abc12345xyz',
      transcriptJson: {
        results: [
          {
            alternatives: [
              {
                transcript: 'Test transcript segment',
                confidence: 0.9,
                words: [
                  {
                    startOffset: '0.0s',
                    endOffset: '1.0s',
                    word: 'Test',
                    confidence: 0.9
                  }
                ]
              }
            ]
          }
        ]
      }
    };

    (client.index as jest.Mock).mockResolvedValue({ result: 'created' });

    const response = await POST(new Request('http://localhost:3000/api/add-video', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody)
    }));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe('Video and transcript snippets added successfully');

    expect(client.index).toHaveBeenCalledTimes(2);
    expect(client.index).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 'videos',
        id: 'abc12345xyz',
        body: expect.objectContaining({
          vidTitle: 'Test Video',
          vidDescription: 'Test Description'
        })
      })
    );
  });

  it('should handle invalid transcript JSON', async () => {
    const mockRequestBody = {
      vidTitle: 'Test Video',
      vidDescription: 'Test Description',
      uploadDate: '2024-03-19',
      recordDate: '2024-03-18',
      location: 'Nepal',
      tags: ['temple', 'history'],
      baseVideoURL: 'https://youtube.com/watch?v=abc12345xyz',
      transcriptJson: {}
    };

    const response = await POST(new Request('http://localhost:3000/api/add-video', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody)
    }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe('Invalid transcript JSON format');
  });

  it('should handle invalid YouTube URL', async () => {
    const mockRequestBody = {
      vidTitle: 'Test Video',
      vidDescription: 'Test Description',
      uploadDate: '2024-03-19',
      recordDate: '2024-03-18',
      location: 'Nepal',
      tags: ['temple', 'history'],
      baseVideoURL: 'https://invalid-url.com',
      transcriptJson: {
        results: [
          {
            alternatives: [
              {
                transcript: 'Test transcript',
                confidence: 0.9,
                words: [
                  {
                    startOffset: '0.0s',
                    endOffset: '1.0s',
                    word: 'Test',
                    confidence: 0.9
                  }
                ]
              }
            ]
          }
        ]
      }
    };

    const response = await POST(new Request('http://localhost:3000/api/add-video', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody)
    }));

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe('Failed to add video data');
  });

  it('should handle translation API errors', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Translation failed' }
        })
      })
    ) as jest.Mock;

    const mockRequestBody = {
      vidTitle: 'Test Video',
      vidDescription: 'Test Description',
      uploadDate: '2024-03-19',
      recordDate: '2024-03-18',
      location: 'Nepal',
      tags: ['temple', 'history'],
      baseVideoURL: 'https://youtube.com/watch?v=abc12345xyz',
      transcriptJson: {
        results: [
          {
            alternatives: [
              {
                transcript: 'Test transcript',
                confidence: 0.9,
                words: [
                  {
                    startOffset: '0.0s',
                    endOffset: '1.0s',
                    word: 'Test',
                    confidence: 0.9
                  }
                ]
              }
            ]
          }
        ]
      }
    };

    const response = await POST(new Request('http://localhost:3000/api/add-video', {
      method: 'POST',
      body: JSON.stringify(mockRequestBody)
    }));

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe('Failed to add video data');
  });
});