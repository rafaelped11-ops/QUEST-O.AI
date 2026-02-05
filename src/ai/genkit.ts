
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit.
 * Utilizamos o plugin genkitx-openai configurado para apontar para a DeepSeek.
 * No Genkit 1.x, os plugins devem ser registrados como funções.
 * Nomeamos a função explicitamente como 'openai' para garantir que o 
 * namespace seja reconhecido corretamente nos prompts (ex: openai/deepseek-chat).
 */

const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    function openai() {
      return openAI({
        apiKey: deepseekKey,
        baseURL: 'https://api.deepseek.com',
      });
    }
  ],
});
