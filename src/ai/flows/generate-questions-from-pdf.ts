
'use server';

/**
 * @fileOverview Gera questões de concurso a partir de um documento PDF.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuestionsFromPdfInputSchema = z.object({
  pdfText: z.string().describe('O texto extraído do documento PDF.'),
  questionType: z.enum(['A', 'C']).describe('Tipo A (Certo/Errado) ou C (Múltipla Escolha).'),
  numberOfQuestions: z.number().int().min(1).max(60).describe('Número de questões desejadas.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('Nível de dificuldade.'),
});

export type GenerateQuestionsFromPdfInput = z.infer<typeof GenerateQuestionsFromPdfInputSchema>;

const GenerateQuestionsFromPdfOutputSchema = z.object({
  questions: z.array(
    z.object({
      text: z.string().describe('O enunciado da questão.'),
      options: z.array(z.string()).optional().describe('Opções de A a E para múltipla escolha.'),
      correctAnswer: z.string().describe('A resposta correta (C/E ou a letra da opção).'),
      justification: z.string().describe('Justificativa pedagógica da questão.'),
      sourcePage: z.number().describe('Número da página no documento original de onde a informação foi extraída.'),
    })
  ),
});

export type GenerateQuestionsFromPdfOutput = z.infer<typeof GenerateQuestionsFromPdfOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateQuestionsFromPdfPrompt',
  input: { schema: GenerateQuestionsFromPdfInputSchema },
  output: { schema: GenerateQuestionsFromPdfOutputSchema },
  prompt: `Você é um especialista em bancas examinadoras de concursos públicos (como Cebraspe e FGV).
  Sua tarefa é gerar {{numberOfQuestions}} questões INÉDITAS baseadas INTEGRALMENTE no texto do documento fornecido abaixo.
  
  O documento é um material de estudo. Você deve cobrir o máximo de tópicos possíveis do documento para garantir uma abordagem integral.
  
  TIPO DE QUESTÃO: {{#if (eq questionType 'A')}}Certo ou Errado (Estilo Cebraspe){{else}}Múltipla Escolha (A a E){{/if}}
  DIFICULDADE: {{difficulty}}
  
  REGRAS:
  1. As questões devem ser desafiadoras e testar o conhecimento real do documento.
  2. Cada questão deve ter uma justificativa clara baseada no texto.
  3. Você deve indicar o número da página exata (conforme o contexto do texto) de onde extraiu a informação.
  4. Se o tipo for 'A', a resposta deve ser 'C' ou 'E'.
  5. Se o tipo for 'C', forneça 5 opções (A, B, C, D, E) e a resposta correta como a letra correspondente.
  
  DOCUMENTO:
  {{{pdfText}}}`,
});

export async function generateQuestionsFromPdf(input: GenerateQuestionsFromPdfInput): Promise<GenerateQuestionsFromPdfOutput> {
  const { output } = await prompt(input);
  return output!;
}
