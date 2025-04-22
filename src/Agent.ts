import ChatOpenAI from "./ChatOpenAI";
import MCPClient from "./MCPClient";
import { log } from "./utils";

export default class Agent {
    private mcpClients: MCPClient[];
    private llm: ChatOpenAI | null = null
    private model: string
    private systemPrompt: string
    private context: string
    constructor(
        model: string,
        mcpClients: MCPClient[],
        systemPrompt: string = '',
        context: string = ''
    ) {
        this.mcpClients = mcpClients;
        this.model = model;
        this.systemPrompt = systemPrompt;
        this.context = context;
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

    async invoke(prompt: string) {
        if (!this.llm) throw new Error('LLM not initialized')
        let response = await this.llm.chat(prompt);
        while (true) {
            // 处理 toolCalls
            if (response.toolCalls.length > 0) {
                for (const toolCall of response.toolCalls) {
                    const mcp = this.mcpClients.find(mcp => mcp.getTools().find(t => t.name === toolCall.function.name));
                    if (!mcp) {
                        this.llm.appendToolResult(toolCall.id, 'Error: Tool not found');
                    } else {
                        log(`TOOL USE - ${toolCall.function.name}`)
                        console.log(`Calling Toll: ${toolCall.function.name} with ${toolCall.function.arguments}`)
                        const result = await mcp.callTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
                        // console.log(`TOOL RESULT - ${JSON.stringify(result)}`)
                        this.llm.appendToolResult(toolCall.id, JSON.stringify(result));
                    }
                }
                response = await this.llm.chat();
                continue;
            }
            await this.close();
            return response.content
        }
    }
}