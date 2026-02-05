
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Configuração central do Genkit utilizando a API da DeepSeek através do plugin OpenAI.
 * No Genkit 1.x, garantimos o registro do namespace 'openai' usando uma função nomeada.
 */

const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

// Definimos uma função nomeada para que o Genkit registre automaticamente o namespace 'openai'
function openai() {
  return openAI({
    apiKey: deepseekKey,
    baseURL: 'https://api.deepseek.com',
  });
}

export const ai = genkit({
  plugins: [openai],
});
