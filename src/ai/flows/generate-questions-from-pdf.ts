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
        TIPO DE QUESTÃO: Certo ou Errado (Estilo Cebraspe).
        - O campo "options" DEVE ser omitido ou uma lista vazia [].
        - O campo "correctAnswer" DEVE ser obrigatoriamente apenas a letra "C" (para Certo) ou "E" (para Errado).
        - Cada item deve ser uma afirmação para o aluno julgar.
      `;
    } else {
      specificInstructions = `
        TIPO DE QUESTÃO: Múltipla Escolha (Estilo convencional).
        - O campo "options" DEVE conter exatamente 5 strings, representando as alternativas A, B, C, D e E.
        - O campo "correctAnswer" DEVE ser a letra da alternativa correta ("A", "B", "C", "D" ou "E").
      `;
    }

    const prompt = `Gere ${input.numberOfQuestions} questões de nível ${input.difficulty} baseadas rigorosamente no texto fornecido abaixo.
    
    ${specificInstructions}

    ESTRUTURA JSON OBRIGATÓRIA:
    {
      "questions": [
        {
          "text": "O enunciado da questão ou afirmação para julgamento",
          "options": ["Opção A", "Opção B", "Opção C", "Opção D", "Opção E"], 
          "correctAnswer": "C/E ou A/B/C/D/E",
          "justification": "Explicação detalhada baseada no texto",
          "sourcePage": 1
        }
      ]
    }
    
    TEXTO DE REFERÊNCIA:
    ${input.pdfText}`;

    const system = `Você é um examinador de bancas de concursos públicos de alto nível. 
    Sua tarefa é criar questões inéditas, desafiadoras e tecnicamente precisas.
    Siga estritamente o formato solicitado.`;

    return await callAI({
      system,
      prompt,
      schema: GenerateQuestionsFromPdfOutputSchema,
    });
  }
);
