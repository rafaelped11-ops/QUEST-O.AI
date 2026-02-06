'use server';

import { z } from 'zod';

/**
 * Provedor Universal de IA via OpenRouter com Fallback Automático.
 * Otimizado para o ambiente do Firebase App Hosting.
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

// Lista de modelos gratuitos estáveis para fallback, reordenada por confiabilidade em JSON
const FREE_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2-7b-instruct:free',
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

  // Instruções reforçadas para saída JSON limpa
  const systemPrompt = `${params.system || 'Você é um assistente útil.'} 
  IMPORTANTE: Responda EXCLUSIVAMENTE com um objeto JSON válido. 
  Não inclua textos explicativos, preâmbulos, comentários ou blocos de código Markdown.
  A saída deve começar com { e terminar com }.`;

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
          temperature: 0.2, // Menor temperatura para maior consistência
        }),
      });

      if (!response.ok) {
        console.warn(`Modelo ${model} indisponível (${response.status}).`);
        continue; 
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) continue;

      // Limpeza robusta do conteúdo
      let cleanContent = content.trim();
      
      // Remove blocos de código markdown se existirem
      if (cleanContent.includes('```')) {
        const matches = cleanContent.match(/```(?:json)?([\s\S]*?)```/);
        if (matches && matches[1]) {
          cleanContent = matches[1].trim();
        } else {
          cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '').trim();
        }
      }
      
      try {
        const jsonData = JSON.parse(cleanContent);
        return params.schema.parse(jsonData);
      } catch (parseError) {
        console.warn(`Falha no parse do modelo ${model}. Tentando próximo...`);
        continue;
      }

    } catch (error: any) {
      lastError = error;
      console.error(`Falha ao tentar modelo ${model}:`, error.message);
    }
  }

  throw lastError || new Error(`Todos os modelos de IA falharam ao gerar uma resposta válida.`);
}
