import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit v1.x.
 * Utilizamos o plugin genkitx-openai para acessar a DeepSeek.
 * O prefixo do modelo para este plugin é 'openai/'.
 */

const deepseekKey =
  process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    openAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com/v1',
    }),
  ],
});
