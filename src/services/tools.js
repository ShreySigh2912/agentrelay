import fetch from 'node-fetch';
import chalk from 'chalk';

class ToolsService {
  /**
   * Execute a dynamic tool defined in the agent configuration
   * @param {Object} tool - The tool definition from config
   * @param {Object} args - The arguments passed by the AI
   * @returns {Promise<any>}
   */
  async execute(tool, args) {
    const { url, method = 'POST', headers = {} } = tool;
    
    console.log(chalk.blue(`[Dynamic Tool] Calling ${tool.name} at ${url}...`));

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: method !== 'GET' ? JSON.stringify(args) : undefined
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed with status ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(chalk.red(`[Dynamic Tool Error] ${tool.name}: ${error.message}`));
      return { error: error.message };
    }
  }

  /**
   * Convert dynamic tool definitions to Model-compatible function declarations
   * @param {Array} tools - List of tool definitions from config
   * @returns {Array} List of function declarations
   */
  getFunctionDeclarations(tools = []) {
    return tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters || { type: 'object', properties: {} }
      }
    }));
  }
}

const toolsService = new ToolsService();
export default toolsService;
