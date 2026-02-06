
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

// Lista de modelos gratuitos estáveis para fallback (usados se o modelo principal falhar)
const FREE_MODELS = [
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
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

  // Modelo solicitado pelo usuário (flux.2-max)
  const requestedModel = process.env.AI_MODEL || 'black-forest-labs/flux.2-max';
  
  // Lista de tentativa: Primeiro o solicitado, depois os fallbacks gratuitos de texto
  const modelsToTry = [requestedModel, ...FREE_MODELS];

  // Instruções reforçadas para saída JSON
  const systemPrompt = `${params.system || 'Você é um assistente útil.'} 
  Responda EXCLUSIVAMENTE com um objeto JSON válido seguindo este esquema: ${JSON.stringify(params.schema)}.
  Não inclua textos explicativos ou blocos de código Markdown (\`\`\`json).`;

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      // Nota: Modelos de imagem como FLUX podem não aceitar response_format json_object
      const isImageModel = model.includes('flux');
      
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
          // Apenas envia format se não for modelo de imagem (evita erro de API se possível)
          ...(isImageModel ? {} : { response_format: { type: 'json_object' } }),
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 402) {
          throw new Error('Saldo insuficiente no OpenRouter.');
        }
        
        if (response.status === 404 || response.status === 400) {
          console.warn(`Modelo ${model} indisponível ou incompatível (${response.status}). Tentando próximo da lista...`);
          continue; 
        }

        throw new Error(`Erro OpenRouter (${response.status}) com modelo ${model}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) throw new Error('A IA retornou uma resposta vazia.');

      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return params.schema.parse(JSON.parse(cleanContent));

    } catch (error: any) {
      if (error.message.includes('Saldo') || error instanceof z.ZodError) {
        throw error;
      }
      
      lastError = error;
      console.error(`Falha ao tentar modelo ${model}:`, error.message);
    }
  }

  throw new Error(`Todos os modelos de IA falharam. Último erro: ${lastError?.message}`);
}
