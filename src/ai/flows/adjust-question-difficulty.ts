
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callAI } from '@/ai/lib/ai-service';

const AdjustQuestionDifficultyOutputSchema = z.object({
  adjustedQuestion: z.string(),
});

export async function adjustQuestionDifficulty(input: {
  question: string;
  currentDifficulty: string;
  desiredDifficulty: string;
}) {
  return adjustQuestionDifficultyFlow(input);
}

const adjustQuestionDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustQuestionDifficultyFlow',
    inputSchema: z.any(),
    outputSchema: AdjustQuestionDifficultyOutputSchema,
  },
  async (input) => {
    return await callAI({
      system: 'Você é um especialista em ajustar o nível de complexidade de questões de concurso.',
      prompt: `Ajuste a seguinte questão de nível ${input.currentDifficulty} para o nível ${input.desiredDifficulty}:\n\n${input.question}`,
      schema: AdjustQuestionDifficultyOutputSchema,
    });
  }
);
