import OpenAI from "openai";
import 'dotenv/config'
import { log } from "./utils"
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface ToolCall {
    id: string;
    function: {
        name: string,
        arguments: string,
    }
}

export default class ChatOpenAI {
    private readonly llm = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
    });
    private readonly model: string
    private readonly messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
    private readonly tools: Tool[] = []
    constructor(model: string, systemPrompt: string = '', tools: Tool[] = [], context: string = '') {
        this.model = model
        this.tools = tools
        if (systemPrompt) {
            this.messages.push({
                role: "system",
                content: systemPrompt,
            })
        }
        if (context) {
            this.messages.push({
                role: "user",
                content: context,
            })
        }
    }

    async chat(prompt?: string) {
        log('CHAT')
        if (prompt) {
            this.messages.push({ role: "user", content: prompt })
        }
        const stream = await this.llm.chat.completions.create({
            model: this.model,
            messages: this.messages,
            stream: true,
            tools: this.getToolsDefinition(),
        });

        // https://platform.openai.com/docs/api-reference/chat-streaming
        let content = ''
        let toolCalls: ToolCall[] = []
        log('RESPONSE')
        for await (const chunk of stream) {
            const delta = chunk.choices[0].delta;
            // 处理 content
            if (delta.content) {
                const contentChunk = delta.content || '';
                content += contentChunk
                process.stdout.write(contentChunk);
            }

            // 处理 tool_calls
            if (delta.tool_calls) {
                for (const toolCallChunk of delta.tool_calls) {
                    // 第一次流式，先创建
                    if (toolCalls.length <= toolCallChunk.index) {
                        toolCalls.push({
                            id: '',
                            function: { name: '', arguments: ''}
                        });
                    }

                    let currentCall = toolCalls[toolCallChunk.index];
                    if (toolCallChunk.id) {
                        currentCall.id += toolCallChunk.id;
                    }
                    if (toolCallChunk.function?.name) {
                        currentCall.function.name += toolCallChunk.function.name;
                    }
                    if (toolCallChunk.function?.arguments) {
                        currentCall.function.arguments += toolCallChunk.function.arguments;
                    }
                }
            }

        }
        this.messages.push ({
            role: "assistant", 
            content,
            tool_calls: toolCalls.map(call => ({
                type: 'function',
                id: call.id,
                function: call.function
            }))
        })
        return { content, toolCalls }
    }

    public appendToolResult (toolCallId: string, toolOutput: string) {
        this.messages.push({ role: "tool", tool_call_id: toolCallId, content: toolOutput })
    }


    private getToolsDefinition() {
        // https://platform.openai.com/docs/api-reference/chat
        return this.tools.map(tool => ({
            type: 'function' as const, 
            function: tool
        }))
    }
}