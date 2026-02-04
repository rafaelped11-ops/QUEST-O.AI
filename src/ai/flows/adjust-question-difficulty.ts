'use server';

/**
 * @fileOverview This file defines a Genkit flow for adjusting the difficulty level of generated questions.
 *
 * adjustQuestionDifficulty - A function that adjusts the difficulty level of a given question.
 * AdjustQuestionDifficultyInput - The input type for the adjustQuestionDifficulty function.
 * AdjustQuestionDifficultyOutput - The return type for the adjustQuestionDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustQuestionDifficultyInputSchema = z.object({
  question: z.string().describe('The question to adjust the difficulty of.'),
  currentDifficulty: z
    .string()
    .describe('The current difficulty level of the question (e.g., easy, medium, hard).'),
  desiredDifficulty: z
    .string()
    .describe('The desired difficulty level of the question (e.g., easy, medium, hard).'),
});
export type AdjustQuestionDifficultyInput = z.infer<
  typeof AdjustQuestionDifficultyInputSchema
>;

const AdjustQuestionDifficultyOutputSchema = z.object({
  adjustedQuestion: z
    .string()
    .describe('The question adjusted to the desired difficulty level.'),
});
export type AdjustQuestionDifficultyOutput = z.infer<
  typeof AdjustQuestionDifficultyOutputSchema
>;

export async function adjustQuestionDifficulty(
  input: AdjustQuestionDifficultyInput
): Promise<AdjustQuestionDifficultyOutput> {
  return adjustQuestionDifficultyFlow(input);
}

const adjustQuestionDifficultyPrompt = ai.definePrompt({
  name: 'adjustQuestionDifficultyPrompt',
  input: {schema: AdjustQuestionDifficultyInputSchema},
  output: {schema: AdjustQuestionDifficultyOutputSchema},
  prompt: `You are an expert in creating questions for competitive exams.
  Your task is to adjust the difficulty level of a given question based on the user's request.

  Here is the original question:
  {{question}}

  The current difficulty level is: {{currentDifficulty}}.
  The desired difficulty level is: {{desiredDifficulty}}.

  Please modify the question to match the desired difficulty level.
  Return only the adjusted question.
  `,
});

const adjustQuestionDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustQuestionDifficultyFlow',
    inputSchema: AdjustQuestionDifficultyInputSchema,
    outputSchema: AdjustQuestionDifficultyOutputSchema,
  },
  async input => {
    const {output} = await adjustQuestionDifficultyPrompt(input);
    return output!;
  }
);
