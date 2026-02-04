'use server';

/**
 * @fileOverview Generates contest questions based on a specific topic.
 *
 * - generateQuestionsFromTopic - A function that generates contest questions.
 * - GenerateQuestionsFromTopicInput - The input type for the generateQuestionsFromTopic function.
 * - GenerateQuestionsFromTopicOutput - The return type for the generateQuestionsFromTopic function.
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

export async function generateQuestionsFromTopic(
  input: GenerateQuestionsFromTopicInput
): Promise<GenerateQuestionsFromTopicOutput> {
  return generateQuestionsFromTopicFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuestionsFromTopicPrompt',
  input: {schema: GenerateQuestionsFromTopicInputSchema},
  output: {schema: GenerateQuestionsFromTopicOutputSchema},
  prompt: `You are an expert in creating contest questions.

  Generate {{numberOfQuestions}} questions about {{topic}} with {{difficulty}} difficulty.

  Each question should have a question and an answer.

  Format the output as a JSON object with a "questions" field that is an array of objects, where each object has a "question" and an "answer" field.

  Example:
  {
    "questions": [
      {
        "question": "What is the capital of France?",
        "answer": "Paris"
      },
      {
        "question": "What is the highest mountain in the world?",
        "answer": "Mount Everest"
      }
    ]
  }`,
});

const generateQuestionsFromTopicFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFromTopicFlow',
    inputSchema: GenerateQuestionsFromTopicInputSchema,
    outputSchema: GenerateQuestionsFromTopicOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
