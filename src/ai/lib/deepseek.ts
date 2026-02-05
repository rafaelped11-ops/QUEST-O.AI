'use server';

import { z } from 'zod';

/**
 * Cliente utilitário para chamadas diretas à API da DeepSeek.
 * Contorna problemas de compatibilidade com plugins do Genkit no Next.js 15.
 */

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function callDeepSeek<T>(params: {
  system?: string;
  prompt: string;
  schema: z.ZodSchema<T>;
}): Promise<T> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY não configurada no ambiente.');
  }

  // Adicionamos instruções de formato JSON ao prompt do sistema para garantir compatibilidade
  const systemPrompt = `${params.system || 'Você é um assistente útil.'} 
  IMPORTANTE: Sua resposta DEVE ser um objeto JSON válido seguindo estritamente este esquema: ${JSON.stringify(params.schema)}.
  Não inclua explicações fora do JSON.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
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
      throw new Error(`Erro na API DeepSeek (${response.status}): ${errorData.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('A API retornou uma resposta vazia.');
    }

    // Parse e validação do esquema
    const parsedData = JSON.parse(content);
    return params.schema.parse(parsedData);
  } catch (error: any) {
    console.error('Falha na chamada DeepSeek:', error);
    throw error;
  }
}
