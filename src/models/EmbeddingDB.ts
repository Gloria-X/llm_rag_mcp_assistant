import { PostgresDB } from '../Postgre';
import { Embedding } from './types';

export class EmbeddingDB extends PostgresDB<Embedding> {
  constructor() {
    super('embeddings');
  }
}