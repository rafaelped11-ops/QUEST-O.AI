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

// Lista de modelos gratuitos estáveis para fallback
const FREE_MODELS = [
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'mistralai/mistral-7b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-8b:free',
  'qwen/qwen-2-7b-instruct:free',
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

  const requestedModel = process.env.AI_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free';
  const modelsToTry = [requestedModel, ...FREE_MODELS.filter(m => m !== requestedModel)];

  // Instruções reforçadas para saída JSON limpa
  const systemPrompt = `${params.system || 'Você é um assistente útil.'} 
  IMPORTANTE: Responda EXCLUSIVAMENTE com um objeto JSON válido. 
  Não inclua textos explicativos, preâmbulos, comentários ou blocos de código Markdown (\`\`\`json).
  Certifique-se de que todos os campos obrigatórios do esquema solicitado estejam presentes e com os tipos corretos.`;

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
          temperature: 0.3, // Menor temperatura para maior consistência no JSON
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402) throw new Error('Saldo insuficiente no OpenRouter.');
        console.warn(`Modelo ${model} indisponível (${response.status}). Tentando próximo...`);
        continue; 
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) continue;

      // Limpeza agressiva para garantir que apenas o JSON seja processado
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const jsonData = JSON.parse(cleanContent);
        // Validação final com o esquema fornecido
        return params.schema.parse(jsonData);
      } catch (parseError) {
        console.warn(`Falha no parse/validação do JSON com modelo ${model}. Tentando próximo...`);
        continue;
      }

    } catch (error: any) {
      lastError = error;
      if (error instanceof z.ZodError) {
        console.error(`Erro de validação com modelo ${model}:`, JSON.stringify(error.errors, null, 2));
      } else {
        console.error(`Falha ao tentar modelo ${model}:`, error.message);
      }
    }
  }

  throw lastError || new Error(`Todos os modelos de IA falharam ao gerar uma resposta válida.`);
}
