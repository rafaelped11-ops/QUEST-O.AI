
'use server';

import { z } from 'zod';

/**
 * Provedor Universal de IA via OpenRouter.
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

export async function callAI<T>(params: {
  system?: string;
  prompt: string;
  schema: z.ZodSchema<T>;
}): Promise<T> {
  const providerKey = 'openrouter';
  const model = process.env.AI_MODEL || 'google/gemma-2-9b-it:free';
  
  const configFactory = PROVIDERS[providerKey];
  const config = configFactory('');

  if (!config.key) {
    throw new Error(`OPENROUTER_API_KEY não configurada no ambiente.`);
  }

  // Instruções reforçadas para saída JSON, essencial para modelos menores/gratuitos
  const systemPrompt = `${params.system || 'Você é um assistente útil.'} 
  Responda EXCLUSIVAMENTE com um objeto JSON válido.
  ESQUEMA JSON: ${JSON.stringify(params.schema)}.
  Não inclua textos explicativos ou blocos de código Markdown (\`\`\`json).`;

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`,
        'HTTP-Referer': 'https://questoesai.app', // Obrigatório para OpenRouter
        'X-Title': 'Questões AÍ',                 // Recomendado para OpenRouter
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: params.prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5, // Menor temperatura para maior consistência no JSON
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 402) throw new Error('Saldo insuficiente no OpenRouter.');
      throw new Error(`Erro OpenRouter (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) throw new Error('A IA retornou uma resposta vazia.');

    // Limpeza de possíveis resíduos de markdown se o modelo ignorar o response_format
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return params.schema.parse(JSON.parse(cleanContent));
  } catch (error: any) {
    console.error('Falha na chamada de IA:', error);
    throw error;
  }
}
