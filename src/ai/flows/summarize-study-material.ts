
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callAI } from '@/ai/lib/ai-service';

const SummarizeStudyMaterialOutputSchema = z.object({
  summary: z.string(),
});

export async function summarizeStudyMaterial(input: { studyMaterial: string }) {
  return summarizeStudyMaterialFlow(input);
}

const summarizeStudyMaterialFlow = ai.defineFlow(
  {
    name: 'summarizeStudyMaterialFlow',
    inputSchema: z.object({ studyMaterial: z.string() }),
    outputSchema: SummarizeStudyMaterialOutputSchema,
  },
  async (input) => {
    return await callAI({
      system: 'Você é um especialista em resumos educacionais concisos e estruturados.',
      prompt: `Extraia os conceitos-chave e forneça um resumo estruturado do seguinte material:\n\n${input.studyMaterial}`,
      schema: SummarizeStudyMaterialOutputSchema,
    });
  }
);
