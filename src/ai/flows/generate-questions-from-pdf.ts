
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
    const format = isTypeA 
      ? "Estilo Cebraspe (Certo ou Errado). A resposta deve ser 'C' ou 'E'." 
      : "Múltipla Escolha (A a E). Forneça exatamente 5 opções claras.";

    const prompt = `Gere ${input.numberOfQuestions} questões de nível ${input.difficulty} baseadas no texto abaixo.
    
    ESTRUTURA JSON OBRIGATÓRIA:
    {
      "questions": [
        {
          "text": "enunciado da questão",
          "options": ["opção A", "opção B", "opção C", "opção D", "opção E"], // Apenas se for Múltipla Escolha
          "correctAnswer": "C ou E ou A/B/C/D/E",
          "justification": "explicação detalhada",
          "sourcePage": 1 // número aproximado da página
        }
      ]
    }

    FORMATO DAS QUESTÕES: ${format}
    
    TEXTO:
    ${input.pdfText}`;

    const system = `Você é um examinador de concursos experiente. Crie questões ABSOLUTAMENTE INÉDITAS.`;

    return await callAI({
      system,
      prompt,
      schema: GenerateQuestionsFromPdfOutputSchema,
    });
  }
);
