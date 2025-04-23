import ChatOpenAI from "./ChatOpenAI";
import MCPClient from "./MCPClient";
import 'dotenv/config'
import { testChatOpenAI } from "./test/testChatOpenAI";
import { testMCP } from "./test/testMCP";
import { testInvoke } from "./test/testInvoke";
import { testDB } from "./test/testDB";
import { testDocumentProcessor } from "./test/testDocumentProcessor";



async function main() {
    const args = process.argv.slice(2);
    const func = args[0];

    switch (func) {
        case 'testInvoke':
            await testInvoke();
            break;
        case 'testDocumentProcessor':
            await testDocumentProcessor();
            break;
        default:
            console.log('input err');
            break;
    }
    
    // await testChatOpenAI()
    // await testMCP()
    // await testInvoke()
    // await testDB()
    // await testDocumentProcessor()
}

main()
