
'use server';
/**
 * @fileOverview Summarizes study material provided by the user.
 *
 * - summarizeStudyMaterial - A function that handles the summarization of study material.
 * - SummarizeStudyMaterialInput - The input type for the summarizeStudyMaterial function.
 * - SummarizeStudyMaterialOutput - The return type for the summarizeStudyMaterial function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeStudyMaterialInputSchema = z.object({
  studyMaterial: z
    .string()
    .describe("The study material to summarize.  Should be text."),
});
export type SummarizeStudyMaterialInput = z.infer<typeof SummarizeStudyMaterialInputSchema>;

const SummarizeStudyMaterialOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the study material.'),
});
export type SummarizeStudyMaterialOutput = z.infer<typeof SummarizeStudyMaterialOutputSchema>;

export async function summarizeStudyMaterial(input: SummarizeStudyMaterialInput): Promise<SummarizeStudyMaterialOutput> {
  return summarizeStudyMaterialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeStudyMaterialPrompt',
  model: 'openai/deepseek-chat',
  input: {schema: SummarizeStudyMaterialInputSchema},
  output: {schema: SummarizeStudyMaterialOutputSchema},
  prompt: `You are an expert summarizer. Summarize the following study material, extracting the key concepts:\n\n{{{studyMaterial}}}`,
});

const summarizeStudyMaterialFlow = ai.defineFlow(
  {
    name: 'summarizeStudyMaterialFlow',
    inputSchema: SummarizeStudyMaterialInputSchema,
    outputSchema: SummarizeStudyMaterialOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
