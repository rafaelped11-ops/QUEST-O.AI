
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callAI } from '@/ai/lib/ai-service';

const ParseManualQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      text: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      justification: z.string(),
      type: z.enum(['A', 'C']),
    })
  ),
});

export async function parseManualQuestions(input: { rawText: string }) {
  return parseManualQuestionsFlow(input);
}

const parseManualQuestionsFlow = ai.defineFlow(
  {
    name: 'parseManualQuestionsFlow',
    inputSchema: z.object({ rawText: z.string() }),
    outputSchema: ParseManualQuestionsOutputSchema,
  },
  async (input) => {
    return await callAI({
      system: 'Você é um assistente especializado em processamento e formatação de textos educacionais.',
      prompt: `Identifique e formate todas as questões presentes no texto bruto abaixo, determinando se são Certo/Errado (Tipo A) ou Múltipla Escolha (Tipo C):\n\n${input.rawText}`,
      schema: ParseManualQuestionsOutputSchema,
    });
  }
);
