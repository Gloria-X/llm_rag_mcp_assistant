export interface VectorStoreItem {
    embedding: number[];
    document: string;
}

export default class VectorStore {
    private vectorStore: VectorStoreItem[];
    constructor() {
        this.vectorStore = [];
    }

    async addItem(item: VectorStoreItem): Promise<void> {
        this.vectorStore.push(item);
    }

    async search() {
        
    }
}

