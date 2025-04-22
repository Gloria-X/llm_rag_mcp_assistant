import MCPClient from "../MCPClient";

const mcpServers = {
    "gitlab": {
        "command": "npx",
        "args": [
            "-y",
            "@modelcontextprotocol/server-gitlab"
        ],
        "env": {
            "GITLAB_PERSONAL_ACCESS_TOKEN": process.env.GITLAB_PERSONAL_ACCESS_TOKEN!,
            "GITLAB_API_URL": process.env.GITLAB_API_URL!
        }
    }
};

const gitlabClient = new MCPClient(
    "my-gitlab-client", // 客户端名称
    mcpServers.gitlab.command,
    mcpServers.gitlab.args,
    mcpServers.gitlab.env
);

async function testMCP() {
    const mcpClient = gitlabClient
    await mcpClient.init()
    // const tools = mcpClient.getTools()
    

    const res = await mcpClient.callTool("get_file_info", { path : 'C:\\code\\xsy\\llm_rag_mcp_assistant\\src\\MCPClient.ts'})
    console.log(res)
    await mcpClient.close()
}

export { testMCP }
