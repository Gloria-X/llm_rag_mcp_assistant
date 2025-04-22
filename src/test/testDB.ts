import { createDBs } from '../models';
// TRUNCATE TABLE document, document_segments, embeddings RESTART IDENTITY;

async function testDB() {
  const { documentDB, documentSegmentDB, embeddingDB } = createDBs();

  try {
    const doc = await documentDB.create({
      user_id: 1,
      word_count: 100,
      doc_language: 'zh'
    });

    const foundDoc = await documentDB.findById(doc.id!);
    console.log('select res:', foundDoc);

    const updatedDoc = await documentDB.update(doc.id!, {
      ...doc,
      word_count: 150
    });
    console.log('update res:', updatedDoc);

  } catch (error) {
    console.error('err:', error);
  }
}

export { testDB } 
