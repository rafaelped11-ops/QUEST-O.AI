
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { callAI } from '@/ai/lib/ai-service';

const SuggestTopicsOutputSchema = z.object({
  topics: z.array(z.string()).length(3),
});

export async function suggestEssayTopics(input: { content: string }) {
  return suggestEssayTopicsFlow(input);
}

const suggestEssayTopicsFlow = ai.defineFlow(
  {
    name: 'suggestEssayTopicsFlow',
    inputSchema: z.object({ content: z.string() }),
    outputSchema: SuggestTopicsOutputSchema,
  },
  async (input) => {
    return await callAI({
      system: `Você é um especialista em sugerir temas de redação para concursos de alto nível, especificamente seguindo o padrão Cebraspe.
      
      CRITÉRIOS CEBRASPE PARA TEMAS:
      1. Os temas devem ser atuais e vinculados ao conteúdo técnico fornecido.
      2. Devem incluir aspectos específicos para o candidato abordar (tópicos 1, 2 e 3).`,
      prompt: `Baseado no conteúdo abaixo, sugira EXATAMENTE 3 temas prováveis. 
      
      IMPORTANTE: Retorne obrigatoriamente um objeto JSON com a chave "topics" contendo uma lista de 3 strings.
      Exemplo: { "topics": ["Tema 1", "Tema 2", "Tema 3"] }

      CONTEÚDO:
      ${input.content}`,
      schema: SuggestTopicsOutputSchema,
    });
  }
);

const CorrectEssayOutputSchema = z.object({
  finalScore: z.number(),
  feedback: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  detailedAnalysis: z.string(),
});

export async function correctEssay(input: { topic: string; essay: string; maxScore: number }) {
  return correctEssayFlow(input);
}

const correctEssayFlow = ai.defineFlow(
  {
    name: 'correctEssayFlow',
    inputSchema: z.object({
      topic: z.string(),
      essay: z.string(),
      maxScore: z.number(),
    }),
    outputSchema: CorrectEssayOutputSchema,
  },
  async (input) => {
    return await callAI({
      system: `Você é um corretor especializado em bancas de concurso. A pontuação máxima é ${input.maxScore}.`,
      prompt: `Avalie a seguinte redação. 
      TEMA: "${input.topic}"
      REDAÇÃO: ${input.essay}`,
      schema: CorrectEssayOutputSchema,
    });
  }
);
