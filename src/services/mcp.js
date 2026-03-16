import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import chalk from 'chalk';

class McpService {
  constructor() {
    this.clients = new Map(); // serverName -> { client, transport }
  }

  /**
   * Connect to an MCP server
   * @param {string} name - Internal name for the server
   * @param {Object} config - { command, args, env }
   */
  async connect(name, config) {
    if (this.clients.has(name)) return this.clients.get(name).client;

    console.log(chalk.cyan(`[MCP] Connecting to server ${name}...`));
    
    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: { ...process.env, ...config.env }
      });

      const client = new Client({
        name: "agent-relay-client",
        version: "0.1.0"
      }, {
        capabilities: {
          tools: {}
        }
      });

      await client.connect(transport);
      this.clients.set(name, { client, transport });
      
      console.log(chalk.green(`[MCP] Connected to ${name} successfully.`));
      return client;
    } catch (error) {
      console.error(chalk.red(`[MCP Error] Failed to connect to ${name}: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get tools from all configured MCP servers for an agent
   * @param {Array} serverConfigs - List of { name, command, args }
   * @returns {Promise<Array>} List of function declarations
   */
  async getAgentTools(serverConfigs = []) {
    const allTools = [];
    
    for (const config of serverConfigs) {
      try {
        const client = await this.connect(config.name, config);
        const { tools } = await client.listTools();
        
        for (const tool of tools) {
          allTools.push({
            type: 'function',
            serverName: config.name, // Custom property to track source
            function: {
              name: `${config.name}__${tool.name}`, // Namespace to avoid collisions
              description: tool.description,
              parameters: tool.inputSchema
            }
          });
        }
      } catch (err) {
        console.error(chalk.red(`[MCP Error] Skipping tools from ${config.name}: ${err.message}`));
      }
    }
    
    return allTools;
  }

  /**
   * Execute a tool on a specific MCP server
   * @param {string} namespacedToolName - "serverName__toolName"
   * @param {Object} args 
   */
  async execute(namespacedToolName, args) {
    const [serverName, ...toolParts] = namespacedToolName.split('__');
    const toolName = toolParts.join('__');
    
    const clientEntry = this.clients.get(serverName);
    if (!clientEntry) throw new Error(`MCP Server ${serverName} not connected`);

    console.log(chalk.blue(`[MCP Tool] Calling ${toolName} on ${serverName}...`));
    const result = await clientEntry.client.callTool({
      name: toolName,
      arguments: args
    });

    return result.content[0].text;
  }

  async disconnectAll() {
    for (const { transport } of this.clients.values()) {
      await transport.close();
    }
    this.clients.clear();
  }
}

const mcpService = new McpService();
export default mcpService;
