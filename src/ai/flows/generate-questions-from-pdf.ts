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
        FORMATO: CERTO OU ERRADO (Estilo Cebraspe).
        - "correctAnswer": Deve ser APENAS a letra "C" ou "E".
        - "options": Deve ser um array vazio [].
      `;
    } else {
      specificInstructions = `
        FORMATO: MÚLTIPLA ESCOLHA (A-E).
        - "options": Deve conter exatamente 5 strings com as alternativas.
        - "correctAnswer": Deve ser a LETRA da resposta correta ("A", "B", "C", "D" ou "E").
      `;
    }

    const prompt = `Gere exatamente ${input.numberOfQuestions} questões de nível ${input.difficulty} baseadas rigorosamente no texto técnico abaixo.

    REGRAS OBRIGATÓRIAS:
    1. ${specificInstructions}
    2. "sourcePage": Tente identificar em qual página do PDF original a informação está. Se não conseguir precisar, use uma estimativa baseada na posição do texto.
    3. Use a chave plural "questions" no JSON de saída.
    
    ESTRUTURA JSON ESPERADA:
    {
      "questions": [
        {
          "text": "...",
          "correctAnswer": "...",
          "justification": "...",
          "sourcePage": 1
        }
      ]
    }

    TEXTO PARA ANÁLISE:
    ${input.pdfText.substring(0, 12000)}
    `;

    return await callAI({
      system: `Você é um examinador de concursos públicos. Crie itens inéditos, técnicos e desafiadores baseados no material fornecido.`,
      prompt,
      schema: GenerateQuestionsFromPdfOutputSchema,
    });
  }
);
