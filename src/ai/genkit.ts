import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit v1.x.
 * Utilizamos o plugin genkitx-openai para acessar a DeepSeek através da baseURL compatível.
 */

const deepseekKey =
  process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    // Em Genkit 1.x, plugins devem ser passados como funções (PluginProvider).
    // Envolvemos a chamada para garantir compatibilidade com o ambiente Turbopack e o SDK.
    () => openAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com/v1',
    }),
  ],
});
