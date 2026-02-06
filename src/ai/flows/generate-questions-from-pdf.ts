'use server';

/**
 * @fileOverview Gera questões de concurso a partir de um documento PDF com páginas dinâmicas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callAI } from '@/ai/lib/ai-service';

const QuestionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  justification: z.string(),
  sourcePage: z.coerce.number().default(1),
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
        - O campo "correctAnswer" DEVE ser APENAS "C" ou "E".
        - O campo "options" deve ser uma lista vazia [].
      `;
    } else {
      specificInstructions = `
        TIPO: Múltipla Escolha.
        - O campo "options" deve conter EXATAMENTE 5 alternativas (texto).
        - O campo "correctAnswer" deve ser a LETRA da resposta correta: "A", "B", "C", "D" ou "E".
      `;
    }

    const prompt = `Gere ${input.numberOfQuestions} questões de nível ${input.difficulty} baseadas no texto fornecido abaixo.
    
    INSTRUÇÕES DE FORMATO:
    1. ${specificInstructions}
    2. "sourcePage": Identifique a página aproximada onde a informação se encontra no texto original.
    3. Responda APENAS com o JSON no formato: { "questions": [...] }

    TEXTO PARA ANÁLISE:
    ${input.pdfText.substring(0, 15000)} // Limite para evitar estouro de tokens
    `;

    return await callAI({
      system: `Você é um examinador de concursos experiente. Gere questões técnicas e doutrinárias com base no material fornecido.`,
      prompt,
      schema: GenerateQuestionsFromPdfOutputSchema,
    });
  }
);
