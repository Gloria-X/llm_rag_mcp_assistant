import { DocumentDB } from './DocumentDB';
import { DocumentSegmentDB } from './DocumentSegmentDB';
import { EmbeddingDB } from './EmbeddingDB';

export function createDBs() {
  return {
    documentDB: new DocumentDB(),
    documentSegmentDB: new DocumentSegmentDB(),
    embeddingDB: new EmbeddingDB()
  };
}
