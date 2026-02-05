import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit v1.x.
 * Utilizamos o plugin genkitx-openai para acessar a DeepSeek através da baseURL compatível.
 * No Genkit 1.x, garantimos que o plugin seja passado como uma função (PluginProvider).
 */

const deepseekKey =
  process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    // Envolvemos a chamada do plugin em uma função para compatibilidade com o Genkit 1.x
    () => openAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com/v1',
    }),
  ],
});
