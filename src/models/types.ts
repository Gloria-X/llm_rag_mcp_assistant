export interface Document {
  id?: number;
  user_id: number;
  word_count: number;
  doc_language: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface DocumentSegment {
  id?: number;
  document_id: number;
  content: string;
  word_count: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Embedding {
  id?: number;
  document_segment_id: number;
  // embedding: number[];
  embedding: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface DocumentWithSegments extends Document {
  segments: DocumentSegment[];
}

export interface DocumentSegmentWithEmbeddings extends DocumentSegment {
  embeddings: Embedding[];
}