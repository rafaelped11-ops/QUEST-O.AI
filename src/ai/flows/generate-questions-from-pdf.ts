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

    const prompt = `Gere ${input.numberOfQuestions} questões de nível ${input.difficulty} baseadas no texto fornecido.
    
    INSTRUÇÕES IMPORTANTES:
    1. ${specificInstructions}
    2. "sourcePage": Estime a página original de onde a informação foi extraída (tente variar as páginas entre 1 e 20 baseado no volume de texto).
    3. Retorne obrigatoriamente um objeto JSON com a chave plural "questions".

    ESTRUTURA EXEMPLO (NÃO COPIE OS VALORES): 
    { 
      "questions": [ 
        { 
          "text": "...", 
          "options": [...], 
          "correctAnswer": "...", 
          "justification": "...", 
          "sourcePage": 12 
        } 
      ] 
    }
    
    TEXTO BASE:
    ${input.pdfText}`;

    return await callAI({
      system: `Você é um examinador de concursos experiente. Gere questões técnicas e doutrinárias.`,
      prompt,
      schema: GenerateQuestionsFromPdfOutputSchema,
    });
  }
);
