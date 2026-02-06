
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
  // Alterado para um modelo free mais estável no OpenRouter
  const model = process.env.AI_MODEL || 'google/gemma-7b-it:free';
  
  const configFactory = PROVIDERS[providerKey];
  const config = configFactory('');

  if (!config.key) {
    throw new Error(`OPENROUTER_API_KEY não configurada no ambiente.`);
  }

  // Instruções reforçadas para saída JSON
  const systemPrompt = `${params.system || 'Você é um assistente útil.'} 
  Responda EXCLUSIVAMENTE com um objeto JSON válido seguindo este esquema: ${JSON.stringify(params.schema)}.
  Não inclua textos explicativos ou blocos de código Markdown (\`\`\`json).`;

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
      if (response.status === 402) throw new Error('Saldo insuficiente no OpenRouter.');
      if (response.status === 404) throw new Error(`Modelo não encontrado (${model}). Tente trocar o AI_MODEL no .env.`);
      throw new Error(`Erro OpenRouter (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) throw new Error('A IA retornou uma resposta vazia.');

    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return params.schema.parse(JSON.parse(cleanContent));
  } catch (error: any) {
    console.error('Falha na chamada de IA:', error);
    throw error;
  }
}
