
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit utilizando a API da DeepSeek através do plugin OpenAI.
 */

const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    // Registramos o plugin como uma função para compatibilidade com Genkit 1.x
    () => openAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com',
    }),
  ],
});
