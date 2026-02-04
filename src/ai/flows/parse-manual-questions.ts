
'use server';

/**
 * @fileOverview Identifica e formata questões a partir de um texto bruto colado pelo usuário.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParseManualQuestionsInputSchema = z.object({
  rawText: z.string().describe('O texto contendo as questões a serem identificadas.'),
});

export type ParseManualQuestionsInput = z.infer<typeof ParseManualQuestionsInputSchema>;

const ParseManualQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      text: z.string().describe('O enunciado da questão.'),
      options: z.array(z.string()).optional().describe('Opções de A a E se for múltipla escolha.'),
      correctAnswer: z.string().describe('A resposta correta (C/E ou a letra da opção).'),
      justification: z.string().describe('Justificativa pedagógica para a resposta.'),
      type: z.enum(['A', 'C']).describe('Tipo A (Certo/Errado) ou C (Múltipla Escolha).'),
    })
  ),
});

export type ParseManualQuestionsOutput = z.infer<typeof ParseManualQuestionsOutputSchema>;

const parsePrompt = ai.definePrompt({
  name: 'parseManualQuestionsPrompt',
  input: { schema: ParseManualQuestionsInputSchema },
  output: { schema: ParseManualQuestionsOutputSchema },
  prompt: `Você é um assistente especializado em processamento de textos educacionais.
  Sua tarefa é ler o texto bruto abaixo e identificar todas as questões presentes.
  
  Para cada questão identificada:
  1. Determine se é Certo/Errado (Tipo A) ou Múltipla Escolha (Tipo C).
  2. Extraia o enunciado e as opções (se houver).
  3. Identifique a resposta correta e crie uma justificativa baseada no contexto.
  
  TEXTO BRUTO:
  {{{rawText}}}`,
});

export async function parseManualQuestions(input: ParseManualQuestionsInput): Promise<ParseManualQuestionsOutput> {
  const { output } = await parsePrompt(input);
  return output!;
}
