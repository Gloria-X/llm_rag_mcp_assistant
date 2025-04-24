import { log } from './utils'
import { RankSegment } from './types'

interface RerankResponse {
    id: string;
    results: {
        document: {
            text: string;
        };
        index: number;
        relevance_score: number;
    }[];
    tokens: {
        input_tokens: number;
        output_tokens: number;
    };
}

export class Reranker {
    private readonly apiUrl: string = process.env.RERANK_BASE_URL!;
    private readonly token: string = process.env.RERANK_KEY!;
    private readonly model: string = process.env.RERANK_MODEL!;

    constructor() {}
    async rerank(query: string, segments: RankSegment[], topK: number): Promise<RankSegment[]> {
        const documents = segments.map(s => s.content);
        
        // https://docs.siliconflow.cn/cn/api-reference/rerank/create-rerank
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                query,
                documents,
                top_n: topK,
                return_documents: false,
                max_chunks_per_doc: 1024,
                overlap_tokens: 80
              })
        };

        try {
            const response = await fetch(this.apiUrl, options);
            if (!response.ok) {
                throw new Error(`rerank - API request err: ${response.statusText}`);
            }
            const result: RerankResponse = await response.json();

            console.log('rerank response:', JSON.stringify(result));

            const rerankedSegments = result.results
                .sort((a, b) => b.relevance_score - a.relevance_score)
                .map(result => ({
                    content: segments[result.index].content,
                    segmentId: segments[result.index].segmentId,
                    documentId: segments[result.index].documentId
                }))
                .slice(0, topK);
            
            log('RERANK SUCCESS')

            return rerankedSegments;
        } catch (error) {
            console.error('rerank err:', error);
            throw error;
        }
    }
}