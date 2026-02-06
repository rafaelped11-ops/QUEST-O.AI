'use server';

import { z } from 'zod';

/**
 * Provedor Universal de IA via OpenRouter com Fallback Automático e Limpeza de JSON Robusta.
 */

interface AIConfig {
  url: string;
  key: string;
}

const PROVIDERS: Record<string, (key: string) => AIConfig> = {
  openrouter: (key) => ({
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: key || process.env.OPENROUTER_API_KEY || '',
  }),
};

// Modelos gratuitos estáveis e confiáveis para JSON
const FREE_MODELS = [
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'qwen/qwen-2.5-7b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
];

export async function callAI<T>(params: {
  system?: string;
  prompt: string;
  schema: z.ZodSchema<T>;
}): Promise<T> {
  const providerKey = 'openrouter';
  const configFactory = PROVIDERS[providerKey];
  const config = configFactory('');

  if (!config.key) {
    throw new Error(`OPENROUTER_API_KEY não configurada no ambiente.`);
  }

  const requestedModel = process.env.AI_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
  const modelsToTry = [requestedModel, ...FREE_MODELS.filter(m => m !== requestedModel)];

  const systemPrompt = `${params.system || 'Você é um assistente útil.'} 
  IMPORTANTE: Responda EXCLUSIVAMENTE com um objeto JSON válido. 
  NUNCA inclua textos explicativos, preâmbulos ou conclusões.
  A saída deve ser apenas o JSON bruto iniciando com { e terminando com }.`;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.key}`,
          'HTTP-Referer': 'https://questoesai.app',
          'X-Title': 'Questões AÍ',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: params.prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1, // Temperatura baixa para maior precisão estrutural
        }),
      });

      if (!response.ok) {
        console.warn(`Modelo ${model} retornou erro ${response.status}. Tentando próximo...`);
        continue;
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) continue;

      // Limpeza de JSON Ultra-Robusta: busca o primeiro { e o último }
      let cleanContent = content.trim();
      const jsonStart = cleanContent.indexOf('{');
      const jsonEnd = cleanContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
      }

      try {
        const jsonData = JSON.parse(cleanContent);
        return params.schema.parse(jsonData);
      } catch (parseError) {
        console.warn(`Modelo ${model} gerou JSON inválido. Tentando próximo...`);
        continue;
      }

    } catch (error: any) {
      lastError = error;
      console.error(`Falha fatal ao tentar modelo ${model}:`, error.message);
    }
  }

  throw lastError || new Error(`A IA não conseguiu gerar uma resposta válida após tentar múltiplos modelos.`);
}
