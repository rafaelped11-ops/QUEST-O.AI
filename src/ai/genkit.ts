
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração do Genkit otimizada para DeepSeek.
 * Força a passagem da chave de API para o plugin OpenAI.
 */
const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com',
    }),
  ],
  model: 'openai/deepseek-chat',
});
