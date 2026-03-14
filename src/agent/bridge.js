import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Config from '../config/index.js';

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

  async send({ sessionId, text }) {
    if (!sessionId || !text) {
      throw new Error('sessionId and text are required');
    }

    const config = this.configManager.load();
    
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }

    const history = this.sessions.get(sessionId);
    history.push({ role: 'user', content: text, timestamp: new Date() });

    try {
      let responseText = '';
      const provider = config.provider;

      if (provider === 'gemini') {
        const genAI = this._getProviderInstance(config);
        const model = genAI.getGenerativeModel({ model: config.model || "gemini-1.5-pro" });
        
        // Gemini handles history slightly differently (user/model roles)
        const chatHistory = history.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));
        
        // Exclude the most recent message from history as it's passed separately
        const previousHistory = chatHistory.slice(0, -1);
        
        const chat = model.startChat({
          history: previousHistory,
          generationConfig: {
            maxOutputTokens: 1000,
          },
          systemInstruction: {
            role: "system",
            parts: [{ text: config.systemPrompt }]
          }
        });

        const result = await chat.sendMessage(text);
        responseText = result.response.text();
        
      } else if (provider === 'claude') {
        const anthropic = this._getProviderInstance(config);
        
        const messages = history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        const result = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          system: config.systemPrompt,
          max_tokens: 1024,
          messages: messages
        });
        
        responseText = result.content[0].text;
        
      } else if (provider === 'openai') {
        const openai = this._getProviderInstance(config);
        
        const messages = [
          { role: 'system', content: config.systemPrompt },
          ...history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        ];

        const result = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: messages,
          max_tokens: 1000
        });
        
        responseText = result.choices[0].message.content;
      }

      history.push({ role: 'assistant', content: responseText, timestamp: new Date() });
      return responseText;

    } catch (error) {
      console.error(`AI Provider Error [${config.provider}]:`, error.message);
      // Revert the last user message since it failed to get a response
      history.pop(); 
      return 'Sorry, I could not reach the AI. Please check your API key with agentrelay config show';
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

export default AgentBridge;
