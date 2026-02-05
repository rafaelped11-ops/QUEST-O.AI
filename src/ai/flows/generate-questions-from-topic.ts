'use server';

/**
 * @fileOverview Gera questões por tópico utilizando integração direta com DeepSeek.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callDeepSeek } from '@/ai/lib/deepseek';

const GenerateQuestionsFromTopicOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
});

export async function generateQuestionsFromTopic(input: {
  topic: string;
  difficulty: string;
  numberOfQuestions: number;
}) {
  return generateQuestionsFromTopicFlow(input);
}

const generateQuestionsFromTopicFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFromTopicFlow',
    inputSchema: z.any(),
    outputSchema: GenerateQuestionsFromTopicOutputSchema,
  },
  async (input) => {
    return await callDeepSeek({
      system: 'Você é um especialista em criar questões de simulado por tópico.',
      prompt: `Gere ${input.numberOfQuestions} questões sobre o tópico "${input.topic}" com dificuldade ${input.difficulty}.`,
      schema: GenerateQuestionsFromTopicOutputSchema,
    });
  }
);
