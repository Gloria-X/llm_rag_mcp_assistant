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
    const res = await agent.invoke(`袭人是谁，和她有关的还有哪些人，他们的关系是什么，分段罗列，将结果写在 ${currentDir}/hongloumeng.txt 文件中`, 10);

    console.log(res);
}

export { testInvoke }
