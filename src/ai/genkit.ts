import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit v1.x.
 * Utilizamos o plugin genkitx-openai para acessar a DeepSeek.
 * Para evitar o erro 'plugin is not a function' no Genkit 1.x, 
 * o plugin é passado como uma função de inicialização.
 */

const deepseekKey =
  process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    // Envolvemos a chamada do plugin em uma função para compatibilidade estrita com o Genkit 1.x
    () => openAI({
      apiKey: deepseekKey,
      baseURL: 'https://api.deepseek.com/v1',
    }),
  ],
});
