import ChatOpenAI from "./ChatOpenAI";
import MCPClient from "./MCPClient";
import 'dotenv/config'
import { testChatOpenAI } from "./test/testChatOpenAI";
import { testMCP } from "./test/testMCP";



async function main() {
    await testChatOpenAI()
    await testMCP()
}

main()
