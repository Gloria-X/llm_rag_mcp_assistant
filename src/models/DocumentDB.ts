import { PostgresDB } from '../Postgre';
import { Document } from './types';

export class DocumentDB extends PostgresDB<Document> {
  constructor() {
    super('document');
  }
}