/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TranscriptWord {
  startOffset?: string;
  endOffset: string;
  word: string;
  confidence: number;
}

export interface TranscriptAlternative {
  transcript: string;
  confidence: number;
  words: TranscriptWord[];
}

export interface TranscriptResult {
  alternatives: TranscriptAlternative[];
  resultEndOffset?: string;
  languageCode?: string;
}

export interface TranscriptJson {
  results: TranscriptResult[];
}

export interface VideoData {
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
  transcriptJson: TranscriptJson;
  englishTranscriptJson: TranscriptJson;
  transcriptEmbedding: number[];
}

export interface RequestBody {
  vidTitle: string;
  vidDescription: string;
  uploadDate: string;
  recordDate: string;
  location: string;
  audio: Audio;
  tags: string[];
  baseVideoURL: string;
}

export interface Audio {
  name: string;
  type: string;
  content: string;
}

export interface TranscriptSegment {
  transcriptSnippet: string;
  startTime: number;
  endTime: number;
  videoLinkToSnippet: string;
  transcriptSegmentIndex: number;
}

export interface SearchFilters {
  uploadDate?: string;
  location?: string;
  tags?: string[];
  vidID?: string; // Added this
}

export interface SearchOptions {
  filters?: SearchFilters;
  from?: number;
  size?: number;
}

export interface ElasticsearchQueryCombined {
  index: string;
  body: {
    query: {
      bool: {
        should: any[];
        filter: any[];
        minimum_should_match?: number;
      };
    };
    from: number;
    size: number;
    _source?:
      | {
          excludes?: string[];
        }
      | undefined;
  };
}

export interface ElasticsearchQuery {
  index: string;
  body: {
    query: {
      bool: {
        must: any[];
        filter: any[];
      };
      multi_match?: {
        query: string;
        fields: string[];
        type: string;
        fuzziness: string;
      };
    };
    from: number;
    size: number;
    _source?: {
      excludes?: string[];
    };
  };
}

export interface VideoDocument {
  vidTitle: string;
  vidDescription: string;
  tags: string[];
  location?: string;
  transcript?: string;
  englishTranslation?: string;
  transcriptEmbedding?: number[];
  vidID: string; // Added this
}

export interface SnippetDocument {
  transcriptSnippet: string;
  englishTranslation?: string;
  snippetEmbedding?: number[];
  vidID: string; // Added this
}

export interface ElasticsearchHit {
  _source: VideoDocument | SnippetDocument;
  _score: number;
}

export interface ElasticsearchResponse {
  hits: {
    hits: ElasticsearchHit[];
    total: number;
    max_score: number;
  };
}

export interface SearchParams {
  keywords: string | string[];
  filters?: SearchFilters;
  from?: number;
  size?: number;
}
