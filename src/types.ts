export interface DocumentText {
    url: string;
    text: string;
  }
  
  export interface TextChunk {
    documentUrl: string;
    documentUrlHash: string;
    chunk: string;
    percentThroughDocument: number;
    chunkIndex: number;
  }
  
  export interface EmbeddingResult {
    documentUrl: string;
    chunk: string;
    percentThroughDocument: number;
    embedding: number[];
  }
  
  export interface SearchResultSuccess {
    progress: 'embedding' | 'finished_embedding';
    results: Array<{
      documentUrl: string;
      chunk: string;
      percentThroughDocument: number;
      score: number;
    }>;
  }
  
  export interface SearchResultError {
    progress: 'error';
    error: string;
    results: [];
  }
  
  export type SearchResult = SearchResultSuccess | SearchResultError;
  