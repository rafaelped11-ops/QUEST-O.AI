
'use server';

/**
 * @fileOverview Gera questões de concurso a partir de um documento PDF.
 * Foca em ineditismo e cobertura integral do texto.
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
      correctAnswer: z.string().describe('A resposta correta (C/E para Tipo A ou a letra da opção para Tipo C).'),
      justification: z.string().describe('Justificativa pedagógica detalhada da questão baseada no texto.'),
      sourcePage: z.number().describe('Número da página aproximada no documento original de onde a informação foi extraída.'),
    })
  ),
});

export type GenerateQuestionsFromPdfOutput = z.infer<typeof GenerateQuestionsFromPdfOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateQuestionsFromPdfPrompt',
  input: { schema: GenerateQuestionsFromPdfInputSchema },
  output: { schema: GenerateQuestionsFromPdfOutputSchema },
  prompt: `Você é um especialista em bancas examinadoras de concursos de alto nível (Cebraspe, FGV, FCC).
  Sua missão é criar {{numberOfQuestions}} questões ABSOLUTAMENTE INÉDITAS baseadas INTEGRALMENTE no texto fornecido.
  
  DIRETRIZES:
  1. ABORDAGEM INTEGRAL: Varra todo o documento, não se limite ao início. Crie um simulado que cubra todos os tópicos importantes.
  2. INEDITISMO: Não use questões conhecidas. Crie novas situações-problema baseadas nas regras do PDF.
  3. FORMATO: {{#if (eq questionType 'A')}}Estilo Cebraspe (Certo ou Errado). A resposta deve ser 'C' ou 'E'.{{else}}Múltipla Escolha (A a E). Forneça 5 opções claras.{{/if}}
  4. DIFICULDADE: {{difficulty}}.
  5. JUSTIFICATIVA: Explique detalhadamente por que o item está correto ou incorreto, citando o conceito do texto.
  6. PÁGINA: Identifique a página do texto de onde a questão foi extraída.
  
  DOCUMENTO:
  {{{pdfText}}}`,
});

export async function generateQuestionsFromPdf(input: GenerateQuestionsFromPdfInput): Promise<GenerateQuestionsFromPdfOutput> {
  const { output } = await prompt(input);
  return output!;
}
