import { PostgresDB } from '../Postgres';
import { Embedding } from './types';

export class EmbeddingDB extends PostgresDB<Embedding> {
  constructor() {
    super('embeddings');
  }
}