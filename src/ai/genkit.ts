
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit utilizando o plugin OpenAI para conectar à DeepSeek.
 * No Genkit 1.x, os plugins devem ser passados como funções.
 */

const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    // Envolvemos o plugin em uma função para compatibilidade com Genkit 1.x
    () => openAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com',
    }),
  ],
});
