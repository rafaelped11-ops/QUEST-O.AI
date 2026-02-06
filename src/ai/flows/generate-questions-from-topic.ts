
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callAI } from '@/ai/lib/ai-service';

const GenerateQuestionsFromTopicOutputSchema = z.object({
  questions: z.array(
    z.object({
      text: z.string(),
      correctAnswer: z.string(),
      justification: z.string(),
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
    const prompt = `Gere ${input.numberOfQuestions} questões sobre "${input.topic}" com dificuldade ${input.difficulty}.
    
    ESTRUTURA JSON OBRIGATÓRIA:
    {
      "questions": [
        {
          "text": "enunciado",
          "correctAnswer": "resposta curta",
          "justification": "explicação"
        }
      ]
    }`;

    return await callAI({
      system: 'Você é um especialista em criar questões de simulado por tópico.',
      prompt,
      schema: GenerateQuestionsFromTopicOutputSchema,
    });
  }
);
