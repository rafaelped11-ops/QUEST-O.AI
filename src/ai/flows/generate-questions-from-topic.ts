
'use server';

/**
 * @fileOverview Generates contest questions based on a specific topic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuestionsFromTopicInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate questions.'),
  difficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The difficulty level of the questions.'),
  numberOfQuestions: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe('The number of questions to generate.'),
});

export type GenerateQuestionsFromTopicInput = z.infer<
  typeof GenerateQuestionsFromTopicInputSchema
>;

const GenerateQuestionsFromTopicOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The generated question.'),
      answer: z.string().describe('The answer to the generated question.'),
    })
  ),
});

export type GenerateQuestionsFromTopicOutput = z.infer<
  typeof GenerateQuestionsFromTopicOutputSchema
>;

const generateQuestionsFromTopicPrompt = ai.definePrompt({
  name: 'generateQuestionsFromTopicPrompt',
  model: 'openai/deepseek-chat',
  input: {schema: GenerateQuestionsFromTopicInputSchema},
  output: {schema: GenerateQuestionsFromTopicOutputSchema},
  prompt: `You are an expert in creating contest questions.
  Generate {{numberOfQuestions}} questions about {{topic}} with {{difficulty}} difficulty.`,
});

export async function generateQuestionsFromTopic(
  input: GenerateQuestionsFromTopicInput
): Promise<GenerateQuestionsFromTopicOutput> {
  const { output } = await generateQuestionsFromTopicPrompt(input);
  return output!;
}
