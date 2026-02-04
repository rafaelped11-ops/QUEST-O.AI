
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit utilizando a API da DeepSeek através do plugin OpenAI.
 */

const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    // Envolvemos o plugin em uma função para garantir compatibilidade com o construtor do Genkit 1.x
    // caso o plugin retorne um objeto de configuração estático (estilo pre-1.0).
    () => openAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com',
    }),
  ],
});
