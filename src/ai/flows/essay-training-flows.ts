
'use server';

/**
 * @fileOverview Fluxos para treino de prova discursiva: sugestão de temas e correção.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- Sugestão de Temas ---

const SuggestTopicsInputSchema = z.object({
  content: z.string().describe('O conteúdo base para sugerir os temas.'),
});

const SuggestTopicsOutputSchema = z.object({
  topics: z.array(z.string()).length(3).describe('Três temas prováveis baseados no conteúdo.'),
});

const suggestTopicsPrompt = ai.definePrompt({
  name: 'suggestEssayTopicsPrompt',
  model: 'openai/deepseek-chat',
  input: { schema: SuggestTopicsInputSchema },
  output: { schema: SuggestTopicsOutputSchema },
  prompt: `Baseado no seguinte conteúdo de estudo, sugira EXATAMENTE 3 temas prováveis para uma prova discursiva de alto nível (estilo Cebraspe).
  Os temas devem ser desafiadores e exigir conhecimento profundo do texto.
  
  CONTEÚDO:
  {{{content}}}`,
});

export async function suggestEssayTopics(input: { content: string }) {
  const { output } = await suggestTopicsPrompt(input);
  return output!;
}

// --- Correção de Redação ---

const CorrectEssayInputSchema = z.object({
  topic: z.string().describe('O tema escolhido.'),
  essay: z.string().describe('O texto escrito pelo usuário.'),
  maxScore: z.number().describe('A pontuação máxima possível.'),
});

const CorrectEssayOutputSchema = z.object({
  finalScore: z.number().describe('A nota final atribuída.'),
  feedback: z.string().describe('Feedback detalhado sobre gramática, conteúdo e estrutura.'),
  strengths: z.array(z.string()).describe('Pontos fortes do texto.'),
  weaknesses: z.array(z.string()).describe('Pontos a melhorar.'),
  detailedAnalysis: z.string().describe('Análise critério a critério (Cebraspe).'),
});

const correctEssayPrompt = ai.definePrompt({
  name: 'correctEssayPrompt',
  model: 'openai/deepseek-chat',
  input: { schema: CorrectEssayInputSchema },
  output: { schema: CorrectEssayOutputSchema },
  prompt: `Você é um corretor especializado em bancas de concurso, especificamente Cebraspe.
  Corrija a redação abaixo sobre o tema "{{topic}}".
  A pontuação máxima permitida é {{maxScore}}.
  
  CRITÉRIOS DE AVALIAÇÃO:
  1. Apresentação e Legibilidade.
  2. Estrutura Textual.
  3. Desenvolvimento do Tema (Conhecimento Técnico).
  4. Domínio da Norma Culta (Gramática).
  
  REDAÇÃO DO USUÁRIO:
  {{{essay}}}`,
});

export async function correctEssay(input: z.infer<typeof CorrectEssayInputSchema>) {
  const { output } = await correctEssayPrompt(input);
  return output!;
}
