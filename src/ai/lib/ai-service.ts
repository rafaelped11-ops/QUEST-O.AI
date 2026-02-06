
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

  // Prepara a lista de modelos (prioriza o do ENV, se houver)
  const envModel = process.env.AI_MODEL;
  const modelsToTry = envModel ? [envModel, ...FREE_MODELS] : FREE_MODELS;

  // Instruções reforçadas para saída JSON
  const systemPrompt = `${params.system || 'Você é um assistente útil.'} 
  Responda EXCLUSIVAMENTE com um objeto JSON válido seguindo este esquema: ${JSON.stringify(params.schema)}.
  Não inclua textos explicativos ou blocos de código Markdown (\`\`\`json).`;

  let lastError: any = null;

  // Loop de Fallback
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
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Se for erro de saldo (402), para o loop imediatamente
        if (response.status === 402) {
          throw new Error('Saldo insuficiente no OpenRouter.');
        }
        
        // Se for 404 (Modelo não encontrado/offline), tenta o próximo modelo
        if (response.status === 404) {
          console.warn(`Modelo ${model} indisponível (404). Tentando próximo da lista...`);
          continue; 
        }

        throw new Error(`Erro OpenRouter (${response.status}) com modelo ${model}: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;

      if (!content) throw new Error('A IA retornou uma resposta vazia.');

      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Se chegamos aqui, deu certo. Retorna o resultado.
      return params.schema.parse(JSON.parse(cleanContent));

    } catch (error: any) {
      // Se for erro de saldo ou parsing de esquema (erros fatais), interrompe
      if (error.message.includes('Saldo') || error instanceof z.ZodError) {
        throw error;
      }
      
      lastError = error;
      console.error(`Falha ao tentar modelo ${model}:`, error.message);
      // Continua para o próximo modelo do loop
    }
  }

  // Se o loop terminar sem sucesso
  throw new Error(`Todos os modelos de IA falharam. Último erro: ${lastError?.message}`);
}
