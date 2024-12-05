import { PUT } from '../elasticsearch/CRUD/update-video/route';
import client from '../../../utils-ts/elasticsearch';
import { generateEmbedding } from '../../../utils-ts/generateEmbeddings';
import { NextRequest } from 'next/server';

jest.mock('../../../utils-ts/elasticsearch', () => ({
  get: jest.fn(),
  update: jest.fn(),
  deleteByQuery: jest.fn(),
  index: jest.fn()
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

describe('PUT /api/update-video', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully update video metadata only', async () => {
    const mockExistingVideo = {
      _source: {
        vidID: 'test-123',
        vidTitle: 'Old Title',
        vidDescription: 'Old Description',
        transcriptJson: {
          results: []
        }
      },
      found: true
    };

    (client.get as jest.Mock).mockResolvedValueOnce(mockExistingVideo);
    (client.update as jest.Mock).mockResolvedValueOnce({ result: 'updated' });

    const updateBody = {
      vidID: 'test-123',
      vidTitle: 'New Title',
      vidDescription: 'New Description'
    };

    const request = new NextRequest('http://localhost:3000/api/update-video', {
      method: 'PUT',
      body: JSON.stringify(updateBody)
    });

    const response = await PUT(request);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.message).toBe('Video updated successfully');

    expect(client.update).toHaveBeenCalledWith({
      index: 'videos',
      id: 'test-123',
      body: {
        doc: {
          vidTitle: 'New Title',
          vidDescription: 'New Description'
        }
      }
    });
  });

  it('should successfully update transcript and regenerate snippets', async () => {
    const mockExistingVideo = {
      _source: {
        vidID: 'test-123',
        vidTitle: 'Test Video',
        baseVideoURL: 'https://youtube.com/watch?v=test-123',
        transcriptJson: {
          results: [{
            alternatives: [{
              transcript: 'Old transcript',
              words: [
                { startOffset: '0.0s', endOffset: '1.0s', word: 'Old', confidence: 0.9 }
              ]
            }]
          }]
        }
      },
      found: true
    };

    (client.get as jest.Mock).mockResolvedValueOnce(mockExistingVideo);
    (client.update as jest.Mock).mockResolvedValueOnce({ result: 'updated' });
    (client.deleteByQuery as jest.Mock).mockResolvedValueOnce({ deleted: 1 });
    (client.index as jest.Mock).mockResolvedValueOnce({ result: 'created' });

    const updateBody = {
      vidID: 'test-123',
      transcriptUpdates: [{
        segmentIndex: 0,
        newTranscript: 'New transcript'
      }]
    };

    const request = new NextRequest('http://localhost:3000/api/update-video', {
      method: 'PUT',
      body: JSON.stringify(updateBody)
    });

    const response = await PUT(request);
    expect(response.status).toBe(200);
    
    expect(client.deleteByQuery).toHaveBeenCalled();
    expect(client.index).toHaveBeenCalled();
    expect(generateEmbedding).toHaveBeenCalled();
  });

  it('should handle non-existent video', async () => {
    (client.get as jest.Mock).mockResolvedValueOnce({ found: false });

    const request = new NextRequest('http://localhost:3000/api/update-video', {
      method: 'PUT',
      body: JSON.stringify({
        vidID: 'nonexistent',
        vidTitle: 'New Title'
      })
    });

    const response = await PUT(request);
    expect(response.status).toBe(404);
    
    const data = await response.json();
    expect(data.error).toBe('Video not found');
  });

  it('should handle translation API errors', async () => {
    const mockExistingVideo = {
      _source: {
        vidID: 'test-123',
        transcriptJson: {
          results: [{
            alternatives: [{
              transcript: 'Test transcript',
              words: [
                { startOffset: '0.0s', endOffset: '1.0s', word: 'Test', confidence: 0.9 }
              ]
            }]
          }]
        }
      },
      found: true
    };

    (client.get as jest.Mock).mockResolvedValueOnce(mockExistingVideo);
    
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Translation failed' }
        })
      })
    ) as jest.Mock;

    const request = new NextRequest('http://localhost:3000/api/update-video', {
      method: 'PUT',
      body: JSON.stringify({
        vidID: 'test-123',
        transcriptUpdates: [{
          segmentIndex: 0,
          newTranscript: 'New transcript'
        }]
      })
    });

    const response = await PUT(request);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('Failed to update video');
  });

  it('should handle elasticsearch errors', async () => {
    (client.get as jest.Mock).mockRejectedValueOnce(new Error('Elasticsearch error'));

    const request = new NextRequest('http://localhost:3000/api/update-video', {
      method: 'PUT',
      body: JSON.stringify({
        vidID: 'test-123',
        vidTitle: 'New Title'
      })
    });

    const response = await PUT(request);
    expect(response.status).toBe(500);
    
    const data = await response.json();
    expect(data.error).toBe('Failed to update video');
  });
});