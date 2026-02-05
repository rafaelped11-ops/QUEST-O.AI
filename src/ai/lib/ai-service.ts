
'use server';

import { z } from 'zod';

/**
 * Provedor Universal de IA.
 * Suporta OpenRouter, DeepSeek e OpenAI nativamente.
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
  deepseek: (key) => ({
    url: 'https://api.deepseek.com/v1/chat/completions',
    key: key || process.env.DEEPSEEK_API_KEY || '',
  }),
  openai: (key) => ({
    url: 'https://api.openai.com/v1/chat/completions',
    key: key || process.env.OPENAI_API_KEY || '',
  }),
};

export async function callAI<T>(params: {
  system?: string;
  prompt: string;
  schema: z.ZodSchema<T>;
}): Promise<T> {
  const providerKey = (process.env.AI_PROVIDER || 'openrouter').toLowerCase();
  const model = process.env.AI_MODEL || 'deepseek/deepseek-chat';
  
  const configFactory = PROVIDERS[providerKey] || PROVIDERS.openrouter;
  const config = configFactory('');

  if (!config.key) {
    throw new Error(`Chave de API para o provedor ${providerKey} não configurada.`);
  }

  const systemPrompt = `${params.system || 'Você é um assistente útil.'} 
  IMPORTANTE: Sua resposta DEVE ser um objeto JSON válido seguindo estritamente este esquema: ${JSON.stringify(params.schema)}.
  Não inclua explicações ou markdown fora do JSON.`;

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`,
        'HTTP-Referer': 'https://questoesai.app', // Necessário para OpenRouter
        'X-Title': 'Questões AÍ',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: params.prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 402) throw new Error('Saldo insuficiente no provedor de IA.');
      throw new Error(`Erro na API (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) throw new Error('A IA retornou uma resposta vazia.');

    return params.schema.parse(JSON.parse(content));
  } catch (error: any) {
    console.error('Falha na chamada de IA:', error);
    throw error;
  }
}
