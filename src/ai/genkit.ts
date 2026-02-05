
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit utilizando o plugin OpenAI para conectar à DeepSeek.
 * Utilizamos genkitx-openai (comunidade) que permite configuração de baseURL.
 */

const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com',
    }),
  ],
});
