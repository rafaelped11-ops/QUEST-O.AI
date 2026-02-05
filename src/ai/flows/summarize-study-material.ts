'use server';
/**
 * @fileOverview Sumariza materiais de estudo fornecidos pelo usuário.
 *
 * - summarizeStudyMaterial - Função que lida com o processo de sumarização.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeStudyMaterialInputSchema = z.object({
  studyMaterial: z
    .string()
    .describe("O material de estudo para sumarizar."),
});

const SummarizeStudyMaterialOutputSchema = z.object({
  summary: z.string().describe('Um resumo conciso do material de estudo.'),
});

const summarizeStudyMaterialPrompt = ai.definePrompt({
  name: 'summarizeStudyMaterialPrompt',
  model: 'openai/deepseek-chat',
  input: { schema: SummarizeStudyMaterialInputSchema },
  output: { schema: SummarizeStudyMaterialOutputSchema },
  prompt: `Você é um especialista em resumos educacionais. 
  Sua tarefa é extrair os conceitos-chave e fornecer um resumo estruturado e conciso do seguinte material:

  Material:
  {{{studyMaterial}}}`,
});

export async function summarizeStudyMaterial(input: z.infer<typeof SummarizeStudyMaterialInputSchema>) {
  const { output } = await summarizeStudyMaterialPrompt(input);
  return output!;
}
