import MCPClient from "../MCPClient";
import Agent from "../Agent";

const gitlabServers = {
    "command": "npx",
    "args": [
        "-y",
        "@modelcontextprotocol/server-gitlab"
    ],
    "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": process.env.GITLAB_PERSONAL_ACCESS_TOKEN!,
        "GITLAB_API_URL": process.env.GITLAB_API_URL!
    }
};

const currentDir = process.cwd();
const filesServers = {
    "command": "npx",
    "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        currentDir
    ]
};

const gitlabMCP = new MCPClient(
    "gitlab",
    gitlabServers.command,
    gitlabServers.args,
    gitlabServers.env
);

const fileMCP = new MCPClient(
    "mcpServers",
    filesServers.command,
    filesServers.args
);


async function testInvoke() {
    // const systemPrompt = ''
    // const context = ''
    // const agent = new Agent('YU-AI', [gitlabMCP, fileMCP])
    const agent = new Agent('YU-AI', [fileMCP])
    await agent.init();
    // const res = await agent.invoke(`在我的 gitlab 中 xsy-pro 的 namespace 下新建一个叫 mcp-test 的项目，并创建一个叫 test.txt 的文件，内容为 "hello world" `);
    const res = await agent.invoke(`让我快速理解操作系统、操作模式、RAG，将结果写在 ${currentDir}/softwareProcessModel.txt 文件中，结果小于 200 字`, 10);

    console.log(res);
}

export { testInvoke }
