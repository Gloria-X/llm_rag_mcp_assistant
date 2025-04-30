import { TextSplitter } from './Split';
import { Embedder } from './Embedding';
import { createDBs } from './models/index';
import { log } from './utils';

export class DocumentProcessor {
	private readonly splitter: TextSplitter;
	private readonly embedder: Embedder;
	private readonly dbs: ReturnType<typeof createDBs>;

	constructor() {
		this.splitter = new TextSplitter();
		this.embedder = new Embedder();
		this.dbs = createDBs();
	}

	async processDocument(filePath: string): Promise<{
		documentId: number;
		segmentCount: number;
		totalWords: number;
	}> {
		try {
			// 读取文件内容和信息，适配 linux | win
			const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || '';

			const doc = await this.dbs.documentDB.create({
				user_id: 1, // 默认为 1
				word_count: 0, // 由 segment_word_count 累加
				doc_language: this.detectLanguage(fileName),
				created_at: new Date(),
				updated_at: new Date(),
			});

			// split document into segments
			const segments = await this.splitter.splitFile(filePath);
			const totalWords = segments.reduce((sum, seg) => sum + seg.wordCount, 0);

			await this.dbs.documentDB.update(doc.id!, {
				...doc,
				word_count: totalWords,
			});

			const createdSegments: any[] = [];
			for (const segment of segments) {
				const createdSegment = await this.dbs.documentSegmentDB.create({
					document_id: doc.id!,
					content: segment.content,
					word_count: segment.wordCount,
					created_at: new Date(),
					updated_at: new Date(),
				});
				createdSegments.push(createdSegment);
			}

			// embedding segments
			const embeddingResults = await this.embedder.processSegments(segments);

			for (const [index, result] of embeddingResults.entries()) {
				const createdSegmentId = createdSegments[index].id!;

				try {
					await this.dbs.embeddingDB.create({
						document_segment_id: createdSegmentId,
						embedding: `[${result.embedding.join(',')}]`, // 转为 psql 向量格式
						created_at: new Date(),
						updated_at: new Date(),
					});
				} catch (error) {
					console.error(`Error creating embedding for segment ${createdSegmentId}:`, error);
				}
			}

			log('PROCESS TEXT DOCUMENT SUCCESS');
			return {
				documentId: doc.id!,
				segmentCount: segments.length,
				totalWords,
			};
		} catch (error) {
			console.error('processDocument err:', error);
			throw error;
		}
	}

	// language decetion
	private detectLanguage(fileName: string): string {
		// TODO
		return 'zh';
	}
}
