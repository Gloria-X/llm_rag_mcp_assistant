import ChatOpenAI from "../ChatOpenAI";

async function testChatOpenAI() {
    const llm = new ChatOpenAI('YU-AI')
    const {content, toolCalls} = await llm.chat('hello')
    console.log(content)
    console.log(toolCalls)
}

export { testChatOpenAI }; 
