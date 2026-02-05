
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit.
 * Utilizamos o plugin genkitx-openai configurado para apontar para a DeepSeek.
 * No Genkit 1.x, os plugins devem ser funções. Nomeamos a função como 'openai'
 * para que o Genkit reconheça o namespace nos nomes dos modelos (ex: openai/deepseek-chat).
 */

const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

export const ai = genkit({
  plugins: [
    // Definimos como uma função nomeada para que o Genkit registre o namespace 'openai' corretamente
    function openai() {
      return openAI({
        apiKey: deepseekKey,
        baseURL: 'https://api.deepseek.com',
      });
    }
  ],
});
