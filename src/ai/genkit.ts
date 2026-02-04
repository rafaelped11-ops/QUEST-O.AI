
import { genkit } from 'genkit';
import { openai } from 'genkitx-openai';

/**
 * Configuração central do Genkit utilizando a API da DeepSeek através do plugin OpenAI.
 * Utilizamos explicitamente a DEEPSEEK_API_KEY para evitar erros de variável ausente.
 */

const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    openai({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com',
    }),
  ],
  model: 'openai/deepseek-chat', // Define o modelo padrão para DeepSeek
});
