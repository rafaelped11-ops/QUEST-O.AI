
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração do Genkit utilizando a API da DeepSeek através do plugin OpenAI.
 * O plugin exige uma apiKey. Se DEEPSEEK_API_KEY não estiver definida, 
 * tentamos usar OPENAI_API_KEY para garantir compatibilidade com provedores que espelham o protocolo.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: 'https://api.deepseek.com',
    }),
  ],
  model: 'openai/deepseek-chat',
});
