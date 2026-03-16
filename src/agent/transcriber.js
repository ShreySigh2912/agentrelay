import fs from 'fs';
import OpenAI from 'openai';
import chalk from 'chalk';
import Config from '../config/index.js';

class AudioTranscriber {
  constructor() {
    this.config = new Config().load();
    // Resolve the key: specifically look for openaiKey, fallback to apiKey if provider is openai
    const key = this.config.openaiKey || (this.config.provider === 'openai' ? this.config.apiKey : null);
    
    if (key) {
      this.openai = new OpenAI({ apiKey: key });
    } else {
      this.openai = null;
    }
  }

  async transcribe(filePath) {
    if (!this.openai) {
      console.log(chalk.yellow('[Transcriber] Skipping transcription: No OpenAI API key configured.'));
      return null;
    }

    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`[Transcriber] File not found: ${filePath}`));
      return null;
    }

    try {
      console.log(chalk.gray(`[Transcriber] Transcribing audio with Whisper...`));
      
      const response = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
      });

      return response.text;
    } catch (error) {
      console.error(chalk.red(`[Transcriber Error] ${error.message}`));
      return null;
    } finally {
      // Clean up the temp file after transcription attempt (success or fail)
      try {
        if (fs.existsSync(filePath)) {
           fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.error(chalk.red(`[Transcriber Error] Could not delete temp file: ${e.message}`));
      }
    }
  }
}

export default new AudioTranscriber();
