import ChatOpenAI from "./ChatOpenAI";
import MCPClient from "./MCPClient";
import { log } from "./utils";
import { Embedder } from "./Embedding";
import { createDBs } from "./models/index";
import { Reranker } from "./Rerank";
import { RankSegment, Similarity } from "./types";

export default class Agent {
    private mcpClients: MCPClient[];
    private llm: ChatOpenAI | null = null;
    private model: string;
    private systemPrompt: string;
    private embedder: Embedder;
    private dbs: ReturnType<typeof createDBs>;

    constructor(
        model: string,
        mcpClients: MCPClient[],
        systemPrompt: string = '',
    ) {
        this.mcpClients = mcpClients;
        this.model = model;
        this.systemPrompt = systemPrompt;
        this.embedder = new Embedder();
        this.dbs = createDBs();
    }

    public async init() {
        log('INIT LLM AND TOOLS')
        this.llm = new ChatOpenAI(this.model, this.systemPrompt);
        for (const mcpClient of this.mcpClients) {
            await mcpClient.init();
        }
        const tools = this.mcpClients.flatMap(mcpClient => mcpClient.getTools());
        this.llm = new ChatOpenAI(this.model, this.systemPrompt, tools);
    }

    public async close() {
        log('CLOSE MCP CLIENTS')
        for await (const mcpClient of this.mcpClients) {
            await mcpClient.close();
        }
    }

    // similarity 余弦相似度
    private cosSimilarity(a: number[], b: number[]): number {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (normA * normB);
    }
    
    private async findSimilarSegments(query: string, topK: number = 3): Promise<{
        ragSegments: RankSegment[];
    }> {
        try {
            // embedding query
            const queryEmbedding = await this.embedder.createEmbedding(query);
            // const queryVector = `[${queryEmbedding.join(',')}]`;

            const allEmbeddings = await this.dbs.embeddingDB.findAll();

            // sort
            const similarities = [] as Similarity[]
            for (const emb of allEmbeddings) {
                const similarity = this.cosSimilarity(queryEmbedding, JSON.parse(emb.embedding))
                const similarityRes = {
                    similarity,
                    segmentId: emb.document_segment_id
                }
                similarities.push(similarityRes)
            }
            similarities.sort((a, b) => b.similarity - a.similarity);

            // top_k
            let topSegments: RankSegment[] = []
            const topKSimilarities = similarities.slice(0, topK);
            for (const sim of topKSimilarities) {
                const segment = await this.dbs.documentSegmentDB.findById(sim.segmentId)
                if (segment) {
                    // log(`FIND SEGMENT - ${sim.segmentId} - FROM DOCUMENT - ${segment.document_id}`)
                    // console.log(`segment: ${segment.content}`)

                    topSegments.push({
                        content: segment.content,
                        segmentId: segment.id!,
                        documentId: segment.document_id
                    });
                }
            }

            log('FIND SIMILAR SEGMENTS')

            return {
                ragSegments: topSegments,
            };
        } catch (error) {
            console.error('findSimilarSegments err:', error);
            throw error;
        }
    }

    async invoke(prompt: string, topk: number = 3, summarize: boolean = false) {
        if (!this.llm) throw new Error('LLM not initialized');
    
        let response;
        let segments: RankSegment[] = []
        
        if (!summarize) {
            // RAG
            const { ragSegments } = await this.findSimilarSegments(prompt, topk * 2);
        
            // Rerank
            const reranker = new Reranker();
            const rerankedSegments = await reranker.rerank(prompt, ragSegments, topk);
        
            // 为每个段落添加标识符
            segments = rerankedSegments.map((segment, index) => ({
                segmentIndex: `[${index + 1}]`,
                ...segment,
            }));
        
            const context = segments
                .map(s => `${s.segmentIndex}: ${s.content}`)
                .join('\n\n');
        
            const enhancedPrompt = `
    context:
    ${context}
    
    prompt: ${prompt}
    
    请务必按照以下要求回答问题：
    1. 对于回答中的每一个关键信息，都必须标注来源，使用方括号标记，例如：[1]、[2]等
    2. 引用格式示例："通过[1]可知..."
    3. 确保每个重要陈述都有对应的引用标记
    4. 如果某个信息来自多个段落，可以同时引用多个来源，例如：[1][2]
    
    请基于以上要求回答问题。
    `;
        
            log('GENERATE CONTEXT SUCCESS')
            prompt = enhancedPrompt;
        }

        response = await this.llm.chat(prompt);
    
        // 处理工具调用
        while (true) {
            if (response.toolCalls.length > 0) {
                for (const toolCall of response.toolCalls) {
                    const mcp = this.mcpClients.find(mcp => mcp.getTools().find(t => t.name === toolCall.function.name));
                    if (!mcp) {
                        this.llm.appendToolResult(toolCall.id, 'Error: Tool not found');
                    } else {
                        log(`TOOL USE - ${toolCall.function.name}`)
                        console.log(`calling toll: ${toolCall.function.name} with ${toolCall.function.arguments}`)
                        const result = await mcp.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
                        this.llm.appendToolResult(toolCall.id, JSON.stringify(result));
                    }
                }
                response = await this.llm.chat();
                continue;
            }
            break;
        }
        await this.close();


        return {
            content: response.content,
            ...(segments.length > 0 && { segments })
        };
    }
}