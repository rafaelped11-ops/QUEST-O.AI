
'use server';
/**
 * @fileOverview Summarizes study material provided by the user.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeStudyMaterialInputSchema = z.object({
  studyMaterial: z
    .string()
    .describe("The study material to summarize. Should be text."),
});

const SummarizeStudyMaterialOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the study material.'),
});

const summarizeStudyMaterialPrompt = ai.definePrompt({
  name: 'summarizeStudyMaterialPrompt',
  model: 'openai/deepseek-chat',
  input: {schema: SummarizeStudyMaterialInputSchema},
  output: {schema: SummarizeStudyMaterialOutputSchema},
  prompt: `You are an expert summarizer. Summarize the following study material, extracting the key concepts:\n\n{{{studyMaterial}}}`,
});

export async function summarizeStudyMaterial(input: z.infer<typeof SummarizeStudyMaterialInputSchema>) {
  const { output } = await summarizeStudyMaterialPrompt(input);
  return output!;
}
