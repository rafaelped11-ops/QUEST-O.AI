
'use server';

/**
 * @fileOverview Gera questões de concurso a partir de um documento PDF.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callAI } from '@/ai/lib/ai-service';

const QuestionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  justification: z.string(),
  sourcePage: z.number(),
});

const GenerateQuestionsFromPdfOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});

export async function generateQuestionsFromPdf(input: {
  pdfText: string;
  questionType: 'A' | 'C';
  numberOfQuestions: number;
  difficulty: string;
}) {
  return generateQuestionsFromPdfFlow(input);
}

const generateQuestionsFromPdfFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFromPdfFlow',
    inputSchema: z.any(),
    outputSchema: GenerateQuestionsFromPdfOutputSchema,
  },
  async (input) => {
    const isTypeA = input.questionType === 'A';
    
    let specificInstructions = "";
    if (isTypeA) {
      specificInstructions = `
        TIPO: Certo ou Errado.
        - "correctAnswer" DEVE ser "C" ou "E".
        - O campo "options" deve ser vazio [].
      `;
    } else {
      specificInstructions = `
        TIPO: Múltipla Escolha.
        - "options" deve ter 5 alternativas.
        - "correctAnswer" deve ser "A", "B", "C", "D" ou "E".
      `;
    }

    const prompt = `Gere ${input.numberOfQuestions} questões de nível ${input.difficulty}.
    
    ${specificInstructions}

    IMPORTANTE: Retorne obrigatoriamente um objeto JSON com a chave plural "questions".
    ESTRUTURA: { "questions": [ { "text": "...", "options": [...], "correctAnswer": "...", "justification": "...", "sourcePage": 1 } ] }
    
    TEXTO:
    ${input.pdfText}`;

    return await callAI({
      system: `Você é um examinador de concursos. Retorne sempre o JSON usando a chave "questions" no plural.`,
      prompt,
      schema: GenerateQuestionsFromPdfOutputSchema,
    });
  }
);
