
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração do Genkit utilizando a API da DeepSeek através do plugin OpenAI.
 * É necessário configurar a variável de ambiente DEEPSEEK_API_KEY.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    }),
  ],
  model: 'openai/deepseek-chat',
});
