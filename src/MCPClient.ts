import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export default class MCPClient {
    private mcp: Client;
    // private anthropic: Anthropic;
    private transport: StdioClientTransport | null = null;
    private tools: Tool[] = [];
    private command: string
    private args: string[]
    private env: Record<string, string>
  
    constructor(
        name: string,
        command: string,
        args: string[],
        env?: Record<string, string>,
        version?: string,
    ) {
    //   this.anthropic = new Anthropic({
    //     apiKey: ANTHROPIC_API_KEY,
    //   });
      this.mcp = new Client({ name, version: version || "1.0.0" });
      this.command = command
      this.args = args
      this.env = env || {}
    }

    public async close() {
        await this.mcp.close();
    }

    public async init() {
        await this.connectToServer();
    }

    public getTools() {
        return this.tools;
    }

    public async callTool(name: string, params?: Record<string, any>) {
        const res = await this.mcp.callTool({
          arguments: params,
          name
         });
        return res
    }

    // cmd + args
    // https://modelcontextprotocol.io/quickstart/client#node
    private async connectToServer() {
        try {
          //   const isJs = serverScriptPath.endsWith(".js");
          //   const isPy = serverScriptPath.endsWith(".py");
          //   if (!isJs && !isPy) {
          //     throw new Error("Server script must be a .js or .py file");
          //   }
          //   const command = isPy
          //     ? process.platform === "win32"
          //       ? "python"
          //       : "python3"
          //     : process.execPath;
            
          this.transport = new StdioClientTransport({
            command: this.command,
            args: this.args,
            env: this.env,
          });
        
          await this.mcp.connect(this.transport);
          
          const toolsResult = await this.mcp.listTools();
          this.tools = toolsResult.tools.map((tool) => {
            return {
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema,
            };
          });
          // console.log(
          //   "Connected to server with tools:",
          //   this.tools.map(({ name }) => name)
          // );
        } catch (e) {
          console.log("Failed to connect to MCP server: ", e);
          throw e;
        }
      }
  }