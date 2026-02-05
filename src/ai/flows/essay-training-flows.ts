'use server';

/**
 * @fileOverview Fluxos para treino de prova discursiva utilizando integração direta com DeepSeek.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callDeepSeek } from '@/ai/lib/deepseek';

// --- Sugestão de Temas ---

const SuggestTopicsOutputSchema = z.object({
  topics: z.array(z.string()).length(3),
});

export async function suggestEssayTopics(input: { content: string }) {
  return suggestEssayTopicsFlow(input);
}

const suggestEssayTopicsFlow = ai.defineFlow(
  {
    name: 'suggestEssayTopicsFlow',
    inputSchema: z.object({ content: z.string() }),
    outputSchema: SuggestTopicsOutputSchema,
  },
  async (input) => {
    return await callDeepSeek({
      system: 'Você é um especialista em sugerir temas de redação para concursos de alto nível (estilo Cebraspe).',
      prompt: `Baseado no seguinte conteúdo, sugira EXATAMENTE 3 temas prováveis para uma prova discursiva desafiadora:\n\n${input.content}`,
      schema: SuggestTopicsOutputSchema,
    });
  }
);

// --- Correção de Redação ---

const CorrectEssayOutputSchema = z.object({
  finalScore: z.number(),
  feedback: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  detailedAnalysis: z.string(),
});

export async function correctEssay(input: { topic: string; essay: string; maxScore: number }) {
  return correctEssayFlow(input);
}

const correctEssayFlow = ai.defineFlow(
  {
    name: 'correctEssayFlow',
    inputSchema: z.any(),
    outputSchema: CorrectEssayOutputSchema,
  },
  async (input) => {
    return await callDeepSeek({
      system: `Você é um corretor especializado em bancas de concurso (Cebraspe). A pontuação máxima é ${input.maxScore}.`,
      prompt: `Corrija a seguinte redação sobre o tema "${input.topic}":\n\n${input.essay}`,
      schema: CorrectEssayOutputSchema,
    });
  }
);
