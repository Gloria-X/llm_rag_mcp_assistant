import MCPClient from "../MCPClient";
import Agent from "../Agent";

const currentDir = process.cwd();
const filesServers = {
    "command": "npx",
    "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        currentDir
    ]
};

const fileMCP = new MCPClient(
    "mcpServers",
    filesServers.command,
    filesServers.args
);


async function testSummary() {
    const agent = new Agent('YU-AI', [fileMCP])
    await agent.init();
    const prompt = `概括 ${currentDir}\\partof-hongloumeng-utf8.txt 文件中第一章的内容，写在 summary.txt 中`
    const res = await agent.invoke(prompt, 10, true);

    console.log(res);
}

export { testSummary }
