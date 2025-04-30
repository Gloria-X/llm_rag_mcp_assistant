import { log } from "./utils";

interface EmbeddingResponse {
  object: string;
  data: {
    embedding: number[];
    index: number;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class Embedder {
  private readonly apiUrl: string = process.env.EMBEDDING_BASE_URL!;
  private readonly token: string = process.env.EMBEDDING_KEY!;
  private readonly model: string = process.env.EMBEDDING_MODEL!;

  constructor() {}

  // https://docs.siliconflow.cn/cn/api-reference/embeddings/create-embeddings
  async createEmbedding(text: string): Promise<number[]> {
    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        encoding_format: "float",
      }),
    };

    try {
      const response = await fetch(this.apiUrl, options);
      if (!response.ok) {
        throw new Error(
          `createEmbedding - API request err: ${response.statusText}`
        );
      }

      const result: EmbeddingResponse = await response.json();
      return result.data[0].embedding;
    } catch (error) {
      console.error("createEmbedding err:", error);
      throw error;
    }
  }

  async createEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    try {
      for (const text of texts) {
        const embedding = await this.createEmbedding(text);
        embeddings.push(embedding);
      }
      return embeddings;
    } catch (error) {
      console.error("createEmbeddings err:", error);
      throw error;
    }
  }

  // 处理文本段落并生成向量
  async processSegments(
    segments: { content: string; wordCount: number }[]
  ): Promise<
    {
      content: string;
      wordCount: number;
      embedding: number[];
    }[]
  > {
    try {
      const embeddings = await this.createEmbeddings(
        segments.map((segment) => segment.content)
      );

      log("EMBEDDING SUCCESS");
      return segments.map((segment, index) => ({
        ...segment,
        embedding: embeddings[index],
      }));
    } catch (error) {
      console.error("processSegments err:", error);
      throw error;
    }
  }
}
