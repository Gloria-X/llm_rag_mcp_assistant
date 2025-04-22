import { PostgresDB } from '../Postgres';
import { DocumentSegment } from './types';

export class DocumentSegmentDB extends PostgresDB<DocumentSegment> {
  constructor() {
    super('document_segments');
  }
}