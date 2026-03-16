import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Config from '../config/index.js';
import agentRouter from './router.js';
import chalk from 'chalk';

class AgentBridge {
  constructor() {
    this.sessions = new Map(); // sessionId -> array of messages
    this.configManager = new Config();
  }

  _getProviderInstance(config) {
    if (!config.apiKey) throw new Error('API key missing');

    switch (config.provider) {
      case 'gemini':
        return new GoogleGenerativeAI(config.apiKey);
      case 'claude':
        return new Anthropic({ apiKey: config.apiKey });
      case 'openai':
        return new OpenAI({ apiKey: config.apiKey });
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  async send({ sessionId, text, channel = 'unknown', senderId = 'unknown', imageBase64 = null, imageMimeType = 'image/jpeg' }) {
    if (!sessionId || (!text && !imageBase64)) {
      throw new Error('sessionId and (text or imageBase64) are required');
    }

    const config = this.configManager.load();
    const gatewayController = (await import('../services/gateway.js')).default;
    
    // Multi-Agent Routing
    const agentId = agentRouter.match(channel, senderId);
    const agentConfig = config.agents?.find(a => a.id === agentId) || config.agents[0];

    // Isolate session per agent
    const isolatedSessionId = `${agentId}:${sessionId}`;

    const sessionManager = (await import('../sessions/manager.js')).default;
    sessionManager.update(sessionId, { agentId });

    if (!this.sessions.has(isolatedSessionId)) {
      this.sessions.set(isolatedSessionId, []);
    }

    const history = this.sessions.get(isolatedSessionId);
    
    // Build the user content for history (text only for history storage)
    const userContent = imageBase64 ? `${text || ''} [Image attached]`.trim() : text;
    history.push({ role: 'user', content: userContent, timestamp: new Date() });

    // Define tools for the agent
    const tools = [
      {
        type: 'function',
        function: {
          name: 'toggle_channel',
          description: 'Enable or disable a messaging channel (whatsapp, telegram, or discord)',
          parameters: {
            type: 'object',
            properties: {
              channel: { type: 'string', enum: ['whatsapp', 'telegram', 'discord'] },
              enabled: { type: 'boolean' }
            },
            required: ['channel', 'enabled']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_gateway_status',
          description: 'Get the current status of all messaging channels',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function',
        function: {
          name: 'update_system_prompt',
          description: 'Update the AI agent system instruction/persona',
          parameters: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'The new system prompt text' }
            },
            required: ['prompt']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'take_photo',
          description: 'Take a photo using a paired mobile device camera. Returns a base64 image.',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_location',
          description: 'Get the current GPS location of a paired mobile device. Returns latitude and longitude.',
          parameters: { type: 'object', properties: {} }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_paired_nodes',
          description: 'List all paired companion devices/mobile nodes connected to the gateway.',
          parameters: { type: 'object', properties: {} }
        }
      }
    ];

    try {
      let responseText = '';
      const provider = config.provider;

      if (provider === 'openai') {
        const openai = this._getProviderInstance(config);
        
        const messages = [
          { role: 'system', content: agentConfig.systemPrompt },
          ...history.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        ];

        // Build the latest user message with optional image
        if (imageBase64) {
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: text || 'What is this image?' },
              { type: 'image_url', image_url: { url: `data:${imageMimeType};base64,${imageBase64}` } }
            ]
          });
        } else {
          messages.push({ role: 'user', content: text });
        }

        let result = await openai.chat.completions.create({
          model: agentConfig.model || 'gpt-4o',
          messages: messages,
          tools: tools,
          tool_choice: 'auto',
          max_tokens: 1000
        });
        
        let message = result.choices[0].message;

        // Handle tool calls
        if (message.tool_calls) {
          for (const toolCall of message.tool_calls) {
            const name = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);
            let toolOutput = '';

            console.log(chalk.blue(`[Agent Tool] Executing ${name}...`));

            if (name === 'toggle_channel') {
              const res = await gatewayController.toggleChannel(args.channel, args.enabled);
              toolOutput = JSON.stringify(res);
            } else if (name === 'get_gateway_status') {
              toolOutput = JSON.stringify(gatewayController.getStatus());
            } else if (name === 'update_system_prompt') {
              const res = await gatewayController.updateSystemPrompt(args.prompt, agentId);
              toolOutput = JSON.stringify(res);
            } else if (name === 'list_paired_nodes') {
              const ng = (await import('../services/node.js')).default;
              toolOutput = JSON.stringify(ng.listNodes());
            } else if (name === 'take_photo') {
              try {
                const ng = (await import('../services/node.js')).default;
                const result = await ng.invokeOnAnyNode('take_photo', {});
                toolOutput = JSON.stringify({ success: true, imageBase64: result.imageBase64, message: 'Photo captured successfully' });
              } catch (e) {
                toolOutput = JSON.stringify({ success: false, message: e.message });
              }
            } else if (name === 'get_location') {
              try {
                const ng = (await import('../services/node.js')).default;
                const result = await ng.invokeOnAnyNode('get_location', {});
                toolOutput = JSON.stringify({ success: true, ...result });
              } catch (e) {
                toolOutput = JSON.stringify({ success: false, message: e.message });
              }
            }

            messages.push(message);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolOutput
            });
          }

          // Get final response after tool execution
          result = await openai.chat.completions.create({
            model: agentConfig.model || 'gpt-4o',
            messages: messages
          });
          responseText = result.choices[0].message.content;
        } else {
          responseText = message.content;
        }
        
      } else if (provider === 'gemini') {
          // Gemini tool calling implementation
          const genAI = this._getProviderInstance(config);
          const model = genAI.getGenerativeModel({ 
            model: agentConfig.model || "gemini-1.5-pro",
            tools: [{ 
              functionDeclarations: tools.map(t => ({
                name: t.function.name,
                description: t.function.description,
                parameters: t.function.parameters
              }))
            }]
          });
          
          const chat = model.startChat({
            history: history.slice(0, -1).map(msg => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            })),
            systemInstruction: agentConfig.systemPrompt
          });

          // Build multimodal parts for Gemini
          const parts = [{ text: text || 'What is this image?' }];
          if (imageBase64) {
            parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
          }

          const result = await chat.sendMessage(parts);
          const call = result.response.functionCalls()?.[0];

          if (call) {
            console.log(chalk.blue(`[Agent Tool] Gemini executing ${call.name}...`));
            let toolOutput = {};

            if (call.name === 'toggle_channel') {
              toolOutput = await gatewayController.toggleChannel(call.args.channel, call.args.enabled);
            } else if (call.name === 'get_gateway_status') {
              toolOutput = gatewayController.getStatus();
            } else if (call.name === 'update_system_prompt') {
              toolOutput = await gatewayController.updateSystemPrompt(call.args.prompt, agentId);
            } else if (call.name === 'list_paired_nodes') {
              const ng = (await import('../services/node.js')).default;
              toolOutput = ng.listNodes();
            } else if (call.name === 'take_photo') {
              try {
                const ng = (await import('../services/node.js')).default;
                const r = await ng.invokeOnAnyNode('take_photo', {});
                toolOutput = { success: true, imageBase64: r.imageBase64, message: 'Photo captured' };
              } catch (e) {
                toolOutput = { success: false, message: e.message };
              }
            } else if (call.name === 'get_location') {
              try {
                const ng = (await import('../services/node.js')).default;
                const r = await ng.invokeOnAnyNode('get_location', {});
                toolOutput = { success: true, ...r };
              } catch (e) {
                toolOutput = { success: false, message: e.message };
              }
            }

            const finalResult = await chat.sendMessage([{
              functionResponse: {
                name: call.name,
                response: { content: toolOutput }
              }
            }]);
            responseText = finalResult.response.text();
          } else {
            responseText = result.response.text();
          }

      } else if (provider === 'claude') {
        // Fallback for Claude without tools for now to keep it simple, or implement if easy
        const anthropic = this._getProviderInstance(config);
        const result = await anthropic.messages.create({
          model: agentConfig.model || 'claude-3-5-sonnet-20240620',
          system: agentConfig.systemPrompt,
          max_tokens: 1024,
          messages: history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content }))
        });
        responseText = result.content[0].text;
      }

      history.push({ role: 'assistant', content: responseText, timestamp: new Date() });
      return responseText;

    } catch (error) {
      console.error(`AI Provider Error [${config.provider}]:`, error.message);
      history.pop(); 
      return `Error: ${error.message}`;
    }
  }

  clearSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  listSessions() {
    return Array.from(this.sessions.keys());
  }

  getSessionHistory(sessionId) {
    return this.sessions.get(sessionId) || [];
  }
}

// Export a singleton instance
const agentBridge = new AgentBridge();
export default agentBridge;
